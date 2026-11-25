---
layout: post
title: "GitHub Pages 블로그가 검색에 잡히도록 설정하는 4가지"
date: 2026-11-25 12:00:00 +0900
description: "GitHub Pages 블로그를 Google Search Console에 등록하고, 사이트맵 제출·SEO와 GEO를 고려한 글쓰기·meta description 설정까지 정리했다."
categories: [ Development ]
tags: [ Google Search Console, GitHub Pages, SEO, 블로그 ]
---

2026년 11월 25일 · @gongsoonyee

GitHub Pages 블로그를 배포하고 나면 사이트가 열리는 것과 Google 검색에서 발견되는 것은 별개의 일이다. `seungah.is-a.dev`를 예로, 검색엔진에 사이트를 알리고 방문자에게 유용한 글을 제공하기 위해 할 일을 세 가지로 정리했다.

## 1. Google Search Console에 사이트 등록하기

[Google Search Console](https://search.google.com/search-console/)은 Google이 페이지를 발견하고 색인했는지, 검색 결과에 어떻게 노출되는지 확인하고 문제가 있을 때 점검하는 곳이다. 먼저 사이트 소유권을 확인해야 한다.

1. [Google Search Console](https://search.google.com/search-console/welcome)에 로그인하고 **속성 추가**를 선택한다.
2. **URL 접두어**를 선택하고 `https://seungah.is-a.dev/`를 입력한다. GitHub 저장소 주소가 아니라 실제로 방문하는 사이트의 HTTPS 주소를 넣는다.
3. 확인 방법에서 **HTML 파일**을 선택하고 Google이 제공한 파일을 다운로드한다.
4. [GitHub 저장소](https://github.com/gongsoonyee/gongsoonyee.github.io)의 **Add file → Upload files**를 눌러 인증 파일을 저장소 루트에 올린다. 파일 이름과 내용은 변경하지 않는다.
5. GitHub Pages 배포가 성공할 때까지 기다린다. 배포 후 Search Console이 안내한 주소인 `https://seungah.is-a.dev/인증파일명.html`을 열어 파일이 실제로 공개됐는지 확인한다.
6. Search Console로 돌아가 **확인**을 누른다. 소유권 확인이 끝나면 파일을 삭제하지 않는다. 인증을 유지하는 데 필요하다.

이 블로그는 URL 접두어와 HTML 파일 방식으로 소유권을 확인했다. DNS 레코드를 바꾸지 않고 GitHub 저장소에 인증 파일 하나를 추가하는 방법이다.

![PPT에 삽입했던 Search Console의 URL 접두어 입력 화면]({{ '/assets/images/2026-11-25-google-search-console/presentation/02-url-prefix.png' | relative_url }})

![PPT에 삽입했던 인증 파일 추가 GitHub 커밋 화면]({{ '/assets/images/2026-11-25-google-search-console/presentation/03-verification-commit.png' | relative_url }})

GitHub Actions에서 Pages 빌드와 배포가 성공했는지 확인하고, 공개된 인증 파일 주소가 정상적으로 열리는지도 확인한다.

![PPT에 삽입했던 GitHub Actions 배포 상태]({{ '/assets/images/2026-11-25-google-search-console/presentation/04-deployment-status.png' | relative_url }})

![PPT에 삽입했던 Pages 빌드와 배포 워크플로]({{ '/assets/images/2026-11-25-google-search-console/presentation/05-deployment-workflow.png' | relative_url }})

배포가 끝나면 Search Console의 확인 버튼을 눌러 소유권 확인을 마친다.

![PPT에 삽입했던 HTML 파일 소유권 확인 화면]({{ '/assets/images/2026-11-25-google-search-console/presentation/06-ownership-verified.png' | relative_url }})

## 2. XML 사이트맵 제출하기

사이트맵은 검색엔진이 사이트의 페이지 주소를 발견하는 데 도움을 주는 XML 파일이다. Jekyll은 플러그인으로 사이트맵을 만들 수 있다.

1. 브라우저에서 [`https://seungah.is-a.dev/sitemap.xml`](https://seungah.is-a.dev/sitemap.xml)을 열어 사이트맵이 공개되어 있는지 확인한다. [`robots.txt`](https://seungah.is-a.dev/robots.txt)에 사이트맵 주소가 안내되는지도 볼 수 있다.
2. Search Console에서 인증한 사이트를 선택하고 **Sitemaps** 메뉴를 연다.
3. **새 사이트맵 추가** 입력란에 `sitemap.xml`을 입력하고 **제출**을 누른다. 사이트 주소가 앞에 표시되므로 파일명만 입력하면 된다.
4. 제출된 사이트맵 목록에서 상태가 **성공**인지 확인한다.

내 사이트맵은 제출 후 성공으로 처리됐고, 상세 화면에서 발견된 페이지 31개를 확인했다. 이 숫자에는 인증 파일도 포함되어 있어 게시글 수와 다르다. 사이트맵 성공은 Google이 파일을 읽었다는 뜻이지, 모든 URL이 검색 결과에 색인됐다는 뜻은 아니다. 색인 여부는 Search Console의 **페이지** 보고서나 개별 **URL 검사**에서 따로 확인한다.

![PPT에 삽입했던 등록 전 XML 사이트맵 화면]({{ '/assets/images/2026-11-25-google-search-console/presentation/01-sitemap-xml.png' | relative_url }})

![PPT에 삽입했던 Search Console 사이트맵 제출 화면]({{ '/assets/images/2026-11-25-google-search-console/presentation/07-sitemap-submitted.png' | relative_url }})

![PPT에 삽입했던 사이트맵 처리 완료와 발견된 페이지 31개 화면]({{ '/assets/images/2026-11-25-google-search-console/presentation/08-sitemap-results.png' | relative_url }})

## 3. Meta description 추가하기

`meta description`은 페이지의 내용을 요약하는 설명이다.
이 블로그는 [Jekyll SEO Tag](https://jekyll.github.io/jekyll-seo-tag/usage/)를 사용하므로 `_config.yml`의 사이트 `description`과 각 글의 Front Matter `description`을 메타 설명으로 사용할 수 있다.

**홈페이지:** 저장소 루트의 `_config.yml`에서 비어 있는 `description`을 블로그 소개로 작성한다.

```yaml
description: "AI와 개발, 대학원 연구, 직접 만든 웹 도구를 기록하는 개인 기술 블로그입니다."
```

**개별 글:** `_posts` 안의 해당 Markdown 파일에서 맨 위 `---` 사이에 글 내용에 맞는 설명을 추가한다.

```yaml
description: "JavaScript와 Canvas로 이미지를 ASCII 문자로 변환하는 원리와 문자 세트별 결과를 소개합니다."
```

파일을 저장하고 사이트를 배포한 뒤 페이지 소스에서 `name="description"`을 검색해 출력됐는지 확인한다. 설명은 페이지마다 고유하고 실제 본문과 일치하도록 쓴다.

사이트 등록과 사이트맵 제출은 검색엔진이 페이지를 발견하도록 돕는 출발점이다. 이후에는 유용한 글을 꾸준히 작성하고, Search Console에서 색인 상태와 검색 노출을 확인하면서 페이지별 설명도 보완하면 된다.
