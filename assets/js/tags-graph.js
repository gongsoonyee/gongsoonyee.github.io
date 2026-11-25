(function () {
  'use strict';

  var toggle = document.getElementById('tags-graph-toggle');
  var listView = document.getElementById('tags-list-view');
  var graphView = document.getElementById('tags-graph-view');
  var canvas = document.getElementById('tags-graph-canvas');
  var wrap = document.getElementById('tags-graph-canvas-wrap');
  var dataElement = document.getElementById('tags-graph-data');
  var popover = document.getElementById('tags-graph-popover');
  if (!toggle || !listView || !graphView || !canvas || !wrap || !dataElement || !popover) {
    console.error('The tags graph is missing required page elements.');
    return;
  }

  var context = canvas.getContext('2d');
  if (!context) {
    console.error('Unable to create a canvas context for the tags graph.');
    return;
  }

  var graphData;
  try {
    graphData = JSON.parse(dataElement.textContent);
  } catch (error) {
    console.error('Unable to parse the tags graph data.', error);
    return;
  }

  var postNodes = graphData.posts.map(function (post) {
    return Object.assign({}, post, { type: 'post', radius: 5 });
  });
  var postsById = new Map(postNodes.map(function (post) { return [post.id, post]; }));
  var tagNodes = graphData.tags.map(function (tag) {
    var relatedPosts = tag.posts.map(function (id) { return postsById.get(id); }).filter(Boolean);
    return Object.assign({}, tag, {
      type: 'tag',
      posts: relatedPosts
    });
  });
  var nodes = tagNodes.concat(postNodes);
  var edges = [];
  tagNodes.forEach(function (tag) {
    tag.posts.forEach(function (post) {
      edges.push({ source: tag, target: post });
    });
  });
  nodes.forEach(function (node) { node.degree = 0; });
  edges.forEach(function (edge) {
    edge.source.degree += 1;
    edge.target.degree += 1;
  });
  var nodeSize = { min: 6, max: 8 };
  function applyNodeSizes() {
    ['tag', 'post'].forEach(function (type) {
      var group = nodes.filter(function (node) { return node.type === type; });
      var degrees = group.map(function (node) { return node.degree; });
      var minDegree = Math.min.apply(null, degrees);
      var maxDegree = Math.max.apply(null, degrees);
      group.forEach(function (node) {
        var degreeRatio = maxDegree === minDegree ? 0 : (node.degree - minDegree) / (maxDegree - minDegree);
        var sizeRatio = Math.sqrt(degreeRatio);
        node.radius = nodeSize.min + sizeRatio * (nodeSize.max - nodeSize.min);
      });
    });
  }
  applyNodeSizes();
  var maximumDegree = Math.max.apply(null, nodes.map(function (node) { return node.degree; }));
  if (!nodes.length) {
    console.error('The tags graph contains no nodes.');
    return;
  }

  var graphLinks = Array.from(document.querySelectorAll('.all-tags-workspace .topics-nav a'));
  var tagSections = Array.from(document.querySelectorAll('.all-tags-group'));
  function highlightTag(id) {
    graphLinks.forEach(function (link) {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  graphLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      highlightTag(decodeURIComponent(link.hash.slice(1)));
    });
  });
  if ('IntersectionObserver' in window) {
    var tagObserver = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      if (visible[0]) highlightTag(visible[0].target.id);
    }, { rootMargin: '-100px 0px -50% 0px' });
    tagSections.forEach(function (section) { tagObserver.observe(section); });
  }

  var width = 0;
  var height = 0;
  var pixelRatio = 1;
  var zoom = 1;
  var panX = 0;
  var panY = 0;
  var alpha = 1;
  var animationFrame = 0;
  var layoutAnimationFrame = 0;
  var pointer = null;
  var activeNode = null;
  var hoveredNode = null;
  var relatedIds = null;
  var initialized = false;
  var popoverNode = null;
  var popoverContent = popover.querySelector('.tags-graph-popover-content');
  var closeButton = popover.querySelector('.tags-graph-popover-close');
  var layoutSelect = document.getElementById('tags-graph-layout');
  if (!layoutSelect) {
    console.error('The tags graph is missing its layout selector.');
    return;
  }
  var layoutMode = 'force';
  var forceSettings = {
    center: 0.52,
    repulsion: 10,
    linkStrength: 1,
    linkDistance: 250
  };

  function seedPosition(node, index) {
    var angle = index * 2.399963229728653;
    var radius = 23 * Math.sqrt(index + 1);
    node.x = Math.cos(angle) * radius;
    node.y = Math.sin(angle) * radius;
    node.vx = 0;
    node.vy = 0;
  }
  nodes.forEach(seedPosition);

  function kickSimulation() {
    alpha = Math.max(alpha, 0.22);
    if (!animationFrame) animationFrame = window.requestAnimationFrame(animate);
  }

  function stopLayoutTransition() {
    if (layoutAnimationFrame) {
      window.cancelAnimationFrame(layoutAnimationFrame);
      layoutAnimationFrame = 0;
    }
  }

  function transitionToPositions(targets) {
    stopLayoutTransition();
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    alpha = 0;
    var starts = nodes.map(function (node) {
      return { x: node.x, y: node.y };
    });
    var minX = Math.min.apply(null, targets.map(function (position) { return position.x; }));
    var maxX = Math.max.apply(null, targets.map(function (position) { return position.x; }));
    var minY = Math.min.apply(null, targets.map(function (position) { return position.y; }));
    var maxY = Math.max.apply(null, targets.map(function (position) { return position.y; }));
    var targetZoom = Math.max(0.35, Math.min(4, Math.min(
      (width - 48) / Math.max(240, maxX - minX + 120),
      (height - 48) / Math.max(180, maxY - minY + 120)
    )));
    var targetPanX = -((minX + maxX) / 2) * targetZoom;
    var targetPanY = -((minY + maxY) / 2) * targetZoom;
    var startZoom = zoom;
    var startPanX = panX;
    var startPanY = panY;
    var startedAt = null;
    var duration = 720;

    function animateTransition(timestamp) {
      if (startedAt === null) startedAt = timestamp;
      var progress = Math.min(1, (timestamp - startedAt) / duration);
      var eased = progress * progress * (3 - 2 * progress);
      zoom = startZoom + (targetZoom - startZoom) * eased;
      panX = startPanX + (targetPanX - startPanX) * eased;
      panY = startPanY + (targetPanY - startPanY) * eased;
      nodes.forEach(function (node, index) {
        node.x = starts[index].x + (targets[index].x - starts[index].x) * eased;
        node.y = starts[index].y + (targets[index].y - starts[index].y) * eased;
        node.vx = 0;
        node.vy = 0;
      });
      draw();
      if (progress < 1) {
        layoutAnimationFrame = window.requestAnimationFrame(animateTransition);
      } else {
        layoutAnimationFrame = 0;
        nodes.forEach(function (node, index) {
          node.x = targets[index].x;
          node.y = targets[index].y;
        });
        zoom = targetZoom;
        panX = targetPanX;
        panY = targetPanY;
        draw();
      }
    }
    layoutAnimationFrame = window.requestAnimationFrame(animateTransition);
  }

  function stepSimulation() {
    var forces = nodes.map(function () { return { x: 0, y: 0 }; });
    var nodeIndexes = new Map(nodes.map(function (node, index) { return [node, index]; }));

    edges.forEach(function (edge) {
      var sourceIndex = nodeIndexes.get(edge.source);
      var targetIndex = nodeIndexes.get(edge.target);
      var dx = edge.target.x - edge.source.x;
      var dy = edge.target.y - edge.source.y;
      var distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      var force = (distance - forceSettings.linkDistance) * 0.003 * forceSettings.linkStrength * alpha;
      var fx = dx / distance * force;
      var fy = dy / distance * force;
      forces[sourceIndex].x += fx;
      forces[sourceIndex].y += fy;
      forces[targetIndex].x -= fx;
      forces[targetIndex].y -= fy;
    });

    for (var i = 0; i < nodes.length; i += 1) {
      for (var j = i + 1; j < nodes.length; j += 1) {
        var dx = nodes[j].x - nodes[i].x;
        var dy = nodes[j].y - nodes[i].y;
        var distanceSquared = Math.max(25, dx * dx + dy * dy);
        var distance = Math.sqrt(distanceSquared);
        var force = Math.min(1.2, forceSettings.repulsion * 110 / distanceSquared) * alpha;
        var fx = dx / distance * force;
        var fy = dy / distance * force;
        forces[i].x -= fx;
        forces[i].y -= fy;
        forces[j].x += fx;
        forces[j].y += fy;
      }
    }

    nodes.forEach(function (node, index) {
      var force = forces[index];
      var distanceFromCenter = Math.sqrt(node.x * node.x + node.y * node.y) || 1;
      var degreeRatio = maximumDegree ? Math.sqrt(node.degree / maximumDegree) : 0;
      var targetRadius = 45 + (1 - degreeRatio) * 340;
      var radialForce = (distanceFromCenter - targetRadius) * forceSettings.center * 0.004;
      force.x -= node.x / distanceFromCenter * radialForce;
      force.y -= node.y / distanceFromCenter * radialForce;
      node.vx = (node.vx + force.x) * 0.82;
      node.vy = (node.vy + force.y) * 0.82;
      node.x += node.vx;
      node.y += node.vy;
    });
    alpha *= 0.985;
  }

  function worldToScreen(node) {
    return {
      x: width / 2 + panX + node.x * zoom,
      y: height / 2 + panY + node.y * zoom
    };
  }

  function draw() {
    if (!width || !height) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2 + panX, height / 2 + panY);
    context.scale(zoom, zoom);

    edges.forEach(function (edge) {
      var isRelated = relatedIds && relatedIds.has(edge.source.id) && relatedIds.has(edge.target.id);
      context.beginPath();
      context.moveTo(edge.source.x, edge.source.y);
      context.lineTo(edge.target.x, edge.target.y);
      context.strokeStyle = relatedIds
        ? (isRelated ? 'rgba(77, 134, 101, 0.72)' : 'rgba(151, 160, 153, 0.1)')
        : 'rgba(133, 145, 137, 0.34)';
      context.lineWidth = isRelated ? 1.5 : 1;
      context.stroke();
    });

    nodes.forEach(function (node) {
      var isActive = node === activeNode || node === hoveredNode;
      var isRelated = !relatedIds || relatedIds.has(node.id);
      var radius = node.radius;
      context.globalAlpha = isRelated ? 1 : 0.16;
      context.beginPath();
      context.arc(node.x, node.y, radius + (node === activeNode ? 2 : 0), 0, Math.PI * 2);
      context.fillStyle = node.type === 'tag' ? '#929a96' : '#6fa982';
      context.fill();
      if (isActive) {
        context.strokeStyle = node.type === 'tag' ? '#69716d' : '#39734f';
        context.lineWidth = 1.5;
        context.stroke();
      }
      context.globalAlpha = isRelated ? 1 : 0.16;
      if (node.type === 'tag' || isActive) {
        context.font = node.type === 'tag' ? '12px system-ui, sans-serif' : '11px system-ui, sans-serif';
        context.fillStyle = node.type === 'tag' ? '#656d68' : '#426b50';
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillText(node.label, node.x + radius + 5, node.y);
      }
      context.globalAlpha = 1;
    });
    context.restore();

    if (popoverNode) positionPopover(popoverNode);
  }

  function animate() {
    stepSimulation();
    draw();
    if (alpha > 0.015) {
      animationFrame = window.requestAnimationFrame(animate);
    } else {
      alpha = 0;
      animationFrame = 0;
      fitGraph();
    }
  }

  function resizeCanvas() {
    var rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    if (initialized) fitGraph();
    else {
      initialized = true;
      kickSimulation();
    }
    draw();
  }

  function fitGraph() {
    if (!width || !height) return;
    var minX = Math.min.apply(null, nodes.map(function (node) { return node.x; }));
    var maxX = Math.max.apply(null, nodes.map(function (node) { return node.x; }));
    var minY = Math.min.apply(null, nodes.map(function (node) { return node.y; }));
    var maxY = Math.max.apply(null, nodes.map(function (node) { return node.y; }));
    var graphWidth = Math.max(240, maxX - minX + 120);
    var graphHeight = Math.max(180, maxY - minY + 120);
    zoom = Math.max(0.35, Math.min(4, Math.min((width - 48) / graphWidth, (height - 48) / graphHeight)));
    panX = -((minX + maxX) / 2) * zoom;
    panY = -((minY + maxY) / 2) * zoom;
    draw();
  }

  function screenToWorld(x, y) {
    return {
      x: (x - width / 2 - panX) / zoom,
      y: (y - height / 2 - panY) / zoom
    };
  }

  function findNodeAt(x, y) {
    var point = screenToWorld(x, y);
    for (var i = nodes.length - 1; i >= 0; i -= 1) {
      var node = nodes[i];
      var dx = point.x - node.x;
      var dy = point.y - node.y;
      if (dx * dx + dy * dy < Math.pow(node.radius + 9 / zoom, 2)) return node;
    }
    return null;
  }

  function setActiveNode(node) {
    activeNode = node;
    relatedIds = null;
    if (node) {
      relatedIds = new Set([node.id]);
      edges.forEach(function (edge) {
        if (edge.source === node) relatedIds.add(edge.target.id);
        if (edge.target === node) relatedIds.add(edge.source.id);
      });
    }
    draw();
  }

  function createLink(post) {
    var link = document.createElement('a');
    link.href = post.href;
    link.textContent = post.label;
    return link;
  }

  function openPopover(node) {
    popoverContent.replaceChildren();
    popoverNode = node;
    setActiveNode(node);

    var heading = document.createElement('h3');
    heading.textContent = node.label;
    popoverContent.appendChild(heading);

    if (node.type === 'tag') {
      var summary = document.createElement('p');
      summary.className = 'tags-graph-popover-summary';
      summary.textContent = '연결된 글 ' + node.posts.length + '편';
      popoverContent.appendChild(summary);

      var list = document.createElement('ul');
      node.posts.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 6)
        .forEach(function (post) {
          var item = document.createElement('li');
          item.appendChild(createLink(post));
          list.appendChild(item);
        });
      popoverContent.appendChild(list);

      var allPosts = document.createElement('a');
      allPosts.className = 'tags-graph-popover-all';
      allPosts.href = node.href;
      allPosts.textContent = '전체 글 보기 ↗';
      popoverContent.appendChild(allPosts);
    } else {
      var date = document.createElement('p');
      date.className = 'tags-graph-popover-summary';
      date.textContent = node.displayDate;
      popoverContent.appendChild(date);

      var readLink = createLink(node);
      readLink.className = 'tags-graph-popover-all';
      readLink.appendChild(document.createTextNode(' ↗'));
      popoverContent.appendChild(readLink);
    }

    popover.hidden = false;
    positionPopover(node);
    closeButton.focus({ preventScroll: true });
  }

  function positionPopover(node) {
    if (popover.hidden || !node) return;
    var point = worldToScreen(node);
    var left = point.x + 14;
    var top = point.y + 14;
    var popoverWidth = popover.offsetWidth;
    var popoverHeight = popover.offsetHeight;
    if (left + popoverWidth > width - 8) left = point.x - popoverWidth - 14;
    if (top + popoverHeight > height - 8) top = point.y - popoverHeight - 14;
    popover.style.left = Math.max(8, Math.min(width - popoverWidth - 8, left)) + 'px';
    popover.style.top = Math.max(8, Math.min(height - popoverHeight - 8, top)) + 'px';
  }

  function closePopover(restoreFocus) {
    popover.hidden = true;
    popoverNode = null;
    setActiveNode(null);
    if (restoreFocus) canvas.focus({ preventScroll: true });
  }

  function zoomAt(factor, x, y) {
    var point = screenToWorld(x, y);
    zoom = Math.max(0.25, Math.min(6, zoom * factor));
    panX = x - width / 2 - point.x * zoom;
    panY = y - height / 2 - point.y * zoom;
    draw();
  }

  function moveKeyboardSelection(direction) {
    if (!activeNode) {
      setActiveNode(nodes[0]);
      return;
    }
    var candidates = nodes.map(function (node) {
      var dx = node.x - activeNode.x;
      var dy = node.y - activeNode.y;
      var primary = direction === 'left' || direction === 'right' ? dx : dy;
      var cross = direction === 'left' || direction === 'right' ? dy : dx;
      if ((direction === 'left' && primary >= 0) || (direction === 'right' && primary <= 0) ||
          (direction === 'up' && primary >= 0) || (direction === 'down' && primary <= 0)) return null;
      return { node: node, score: Math.abs(primary) + Math.abs(cross) * 2.5 };
    }).filter(Boolean).sort(function (a, b) { return a.score - b.score; });
    if (candidates[0]) setActiveNode(candidates[0].node);
  }

  function nodeDegree(node) {
    return node.degree;
  }

  function setPosition(node, x, y) {
    node.x = x;
    node.y = y;
    node.vx = 0;
    node.vy = 0;
  }

  function arrangeByDegree() {
    var groups = new Map();
    nodes.forEach(function (node) {
      var degree = nodeDegree(node);
      if (!groups.has(degree)) groups.set(degree, []);
      groups.get(degree).push(node);
    });
    var degrees = Array.from(groups.keys()).sort(function (a, b) { return b - a; });
    degrees.forEach(function (degree, ringIndex) {
      var group = groups.get(degree).sort(function (a, b) { return a.id.localeCompare(b.id); });
      var radius = degrees.length === 1 ? 0 : 55 + ringIndex * 72;
      group.forEach(function (node, index) {
        var angle = -Math.PI / 2 + index * Math.PI * 2 / group.length;
        setPosition(node, Math.cos(angle) * radius, Math.sin(angle) * radius);
      });
    });
  }

  function arrangeOnCircle() {
    var orderedNodes = nodes.slice().sort(function (a, b) {
      return nodeDegree(b) - nodeDegree(a) || a.type.localeCompare(b.type) || a.id.localeCompare(b.id);
    });
    var radius = Math.max(180, orderedNodes.length * 8);
    orderedNodes.forEach(function (node, index) {
      var angle = -Math.PI / 2 + index * Math.PI * 2 / orderedNodes.length;
      setPosition(node, Math.cos(angle) * radius, Math.sin(angle) * radius);
    });
  }

  function arrangeTagClusters() {
    var postAngles = new Map();
    var postsRadius = Math.max(210, postNodes.length * 12);
    postNodes.forEach(function (post, index) {
      var angle = -Math.PI / 2 + index * Math.PI * 2 / postNodes.length;
      postAngles.set(post, angle);
      setPosition(post, Math.cos(angle) * postsRadius, Math.sin(angle) * postsRadius);
    });

    var tagsByPost = new Map(postNodes.map(function (post) { return [post, []]; }));
    tagNodes.forEach(function (tag) {
      var parent = tag.posts[0];
      if (parent) tagsByPost.get(parent).push(tag);
    });
    tagsByPost.forEach(function (tags, post) {
      tags.sort(function (a, b) { return a.id.localeCompare(b.id); });
      var postAngle = postAngles.get(post);
      tags.forEach(function (tag, index) {
        var angle = postAngle + (index - (tags.length - 1) / 2) * 0.32;
        var radius = postsRadius + 65 + Math.min(35, tag.posts.length * 8);
        setPosition(tag, post.x + Math.cos(angle) * radius, post.y + Math.sin(angle) * radius);
      });
    });
  }

  function relayout(mode) {
    layoutMode = mode;
    popover.hidden = true;
    popoverNode = null;
    setActiveNode(null);
    if (mode === 'force') {
      stopLayoutTransition();
      alpha = 1;
      kickSimulation();
    } else {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      var targets = nodes.map(function (node) { return { x: node.x, y: node.y }; });
      var savedPositions = nodes.map(function (node) { return { x: node.x, y: node.y }; });
      if (mode === 'radial') arrangeByDegree();
      else if (mode === 'circle') arrangeOnCircle();
      else if (mode === 'clusters') arrangeTagClusters();
      nodes.forEach(function (node, index) {
        targets[index] = { x: node.x, y: node.y };
        node.x = savedPositions[index].x;
        node.y = savedPositions[index].y;
      });
      transitionToPositions(targets);
    }
  }

  canvas.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return;
    var rect = canvas.getBoundingClientRect();
    pointer = {
      id: event.pointerId,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      lastX: event.clientX - rect.left,
      lastY: event.clientY - rect.top,
      node: findNodeAt(event.clientX - rect.left, event.clientY - rect.top),
      moved: false
    };
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  canvas.addEventListener('pointermove', function (event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    if (!pointer || pointer.id !== event.pointerId) {
      hoveredNode = findNodeAt(x, y);
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
      draw();
      return;
    }
    var dx = x - pointer.lastX;
    var dy = y - pointer.lastY;
    if (Math.abs(x - pointer.x) + Math.abs(y - pointer.y) > 4) pointer.moved = true;
    if (pointer.moved && pointer.node) {
      var point = screenToWorld(x, y);
      pointer.node.x = point.x;
      pointer.node.y = point.y;
      pointer.node.vx = 0;
      pointer.node.vy = 0;
      kickSimulation();
    } else if (pointer.moved) {
      panX += dx;
      panY += dy;
    }
    pointer.lastX = x;
    pointer.lastY = y;
    draw();
  });

  function finishPointer(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (pointer.node && !pointer.moved) openPopover(pointer.node);
    else if (!pointer.node && !pointer.moved) {
      closePopover();
      hoveredNode = null;
    } else if (pointer.node) {
      pointer.node.vx = 0;
      pointer.node.vy = 0;
      kickSimulation();
    }
    pointer = null;
    draw();
  }
  canvas.addEventListener('pointerup', finishPointer);
  canvas.addEventListener('pointercancel', finishPointer);

  canvas.addEventListener('wheel', function (event) {
    event.preventDefault();
    var rect = canvas.getBoundingClientRect();
    zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });

  canvas.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !popover.hidden) {
      closePopover(true);
      return;
    }
    var directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (directions[event.key]) {
      event.preventDefault();
      moveKeyboardSelection(directions[event.key]);
    } else if ((event.key === 'Enter' || event.key === ' ') && activeNode) {
      event.preventDefault();
      openPopover(activeNode);
    }
  });

  closeButton.addEventListener('click', function () { closePopover(true); });
  document.addEventListener('pointerdown', function (event) {
    if (!popover.hidden && !popover.contains(event.target) && event.target !== canvas) closePopover();
  });

  graphView.querySelectorAll('[data-graph-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (!initialized) resizeCanvas();
      if (!width || !height) return;
      var action = button.dataset.graphAction;
      if (action === 'zoom-in') zoomAt(1.25, width / 2, height / 2);
      else if (action === 'zoom-out') zoomAt(0.8, width / 2, height / 2);
      else if (action === 'fit') fitGraph();
      else if (action === 'relayout') relayout(layoutSelect.value);
      else if (action === 'reset') {
        popover.hidden = true;
        popoverNode = null;
        setActiveNode(null);
        fitGraph();
      }
    });
  });

  layoutSelect.addEventListener('change', function () {
    relayout(layoutSelect.value);
  });

  graphView.querySelectorAll('[data-setting]').forEach(function (input) {
    var setting = input.dataset.setting;
    var output = graphView.querySelector('[data-setting-output="' + setting + '"]');
    input.addEventListener('input', function () {
      forceSettings[setting === 'link-strength' ? 'linkStrength' :
        setting === 'link-distance' ? 'linkDistance' : setting] = Number(input.value);
      if (output) output.value = setting === 'link-distance'
        ? input.value
        : Number(input.value).toFixed(2);
      if (layoutMode !== 'force') {
        layoutMode = 'force';
        layoutSelect.value = 'force';
        relayout('force');
      } else {
        kickSimulation();
      }
    });
  });

  graphView.querySelectorAll('[data-node-size]').forEach(function (input) {
    var dimension = input.dataset.nodeSize;
    var output = graphView.querySelector('[data-size-output="' + dimension + '"]');
    input.addEventListener('input', function () {
      var value = Number(input.value);
      var otherDimension = dimension === 'min' ? 'max' : 'min';
      var otherInput = graphView.querySelector('[data-node-size="' + otherDimension + '"]');
      var otherOutput = graphView.querySelector('[data-size-output="' + otherDimension + '"]');

      if (dimension === 'min' && value > nodeSize.max) {
        nodeSize.max = value;
        otherInput.value = String(value);
        otherOutput.value = String(value);
      } else if (dimension === 'max' && value < nodeSize.min) {
        nodeSize.min = value;
        otherInput.value = String(value);
        otherOutput.value = String(value);
      }

      nodeSize[dimension] = value;
      if (output) output.value = String(value);
      applyNodeSizes();
      draw();
    });
  });

  toggle.addEventListener('change', function () {
    listView.hidden = toggle.checked;
    graphView.hidden = !toggle.checked;
    if (toggle.checked) {
      resizeCanvas();
      canvas.focus({ preventScroll: true });
    } else if (!popover.hidden) {
      popover.hidden = true;
      popoverNode = null;
    }
  });

  window.addEventListener('resize', function () {
    if (toggle.checked) resizeCanvas();
  });
})();
