---
layout: post
title: "웹을 움직이게 만드는 시각화 라이브러리 3종"
categories: [ AI, Development ]
---

2026년 8월 12일 · @gongsoonyee

요즘 잘 만든 서비스를 보면 공통점이 하나 있습니다. **움직임이 자연스럽다**는 거죠. 대시보드의 차트는 데이터가 바뀔 때 부드럽게 흐르고, 버튼은 누르는 순간 살짝 눌리는 느낌을 주고, 랜딩 페이지는 첫 화면부터 시선을 확 끌어당깁니다.

이런 걸 직접 다 구현하려면 끝이 없습니다. 그래서 오늘은 각 영역에서 요즘 많이 쓰이는 라이브러리 세 가지를 정리해 봤습니다.

- **bklit UI** — 예쁜 데이터 시각화
- **Motion** — 자연스러운 인터랙션
- **anime.js** — 화려하고 복잡한 애니메이션

각각 뭔지, 어떻게 세팅하는지, 실제로 어떻게 쓰는지 순서대로 가볼게요.

---

## bklit UI — 조립해서 만드는 차트

GitHub: [github.com/bklit/bklit-ui](https://github.com/bklit/bklit-ui)

### 이게 뭐예요?

bklit UI는 React용 오픈소스 차트 라이브러리입니다. 처음 보면 "또 차트 라이브러리야?" 싶은데, 방식이 조금 다릅니다.

일반적인 차트 라이브러리는 npm으로 설치해서 정해진 옵션만 바꿔 쓰잖아요. bklit UI는 **shadcn/ui처럼 차트의 소스 코드 자체를 내 프로젝트로 복사**해 줍니다. 그래서 마음에 안 드는 부분이 있으면 코드를 직접 고치면 끝이에요.

내부적으로는 그리기는 visx, 애니메이션은 Motion이 담당하고 있어서 기본 디자인과 움직임이 꽤 세련됐습니다. Line, Area, Bar, Pie, Ring, Radar, Sankey, Candlestick 등 웬만한 차트는 다 있어요.

### 세팅하기

React(Next.js) + Tailwind 환경에서 shadcn만 초기화하면 바로 쓸 수 있습니다.

```bash
npx shadcn@latest init
npx shadcn@latest add @bklit/line-chart
```

명령을 실행하면 필요한 차트 파일과 의존성이 알아서 들어옵니다.

### 시각화해보기

가장 기본인 라인 차트를 만들어 볼게요.

```tsx
"use client";
import { LineChart, Line, Grid, XAxis, ChartTooltip } from "@/components/charts"; // 생성된 경로에 맞게

const data = [
  { date: new Date("2026-11-01"), users: 1200 },
  { date: new Date("2026-11-02"), users: 1350 },
  { date: new Date("2026-11-03"), users: 1450 },
];

export default function UsersChart() {
  return (
    <LineChart data={data}>
      <Grid horizontal />
      <Line dataKey="users" />
      <XAxis />
      <ChartTooltip />
    </LineChart>
  );
}
```

보시면 `Grid`, `XAxis`, `ChartTooltip`을 레고 블록처럼 끼워 넣는 구조예요. 그리드가 필요 없으면 그 줄만 지우면 되고, 툴팁이 필요하면 한 줄 추가하면 됩니다. 데이터를 state로 바꾸면 차트가 알아서 부드럽게 전환되는 것도 장점이에요.

코드 짜기 전에 감을 잡고 싶다면 **Bklit Studio**(ui.bklit.com/studio)를 추천합니다. 웹에서 차트 스타일을 이리저리 바꿔보고 마음에 들면 코드를 그대로 복사해 올 수 있어요.

> 참고: 검색하다 보면 "릴리스 파일을 다운로드하라"는 비공식 저장소가 보이는데, 공식 저장소는 위 링크이고 설치는 shadcn CLI로 하는 게 정석입니다.

---

## Motion — 손에 착 붙는 인터랙션

GitHub: [github.com/motiondivision/motion](https://github.com/motiondivision/motion)

### 이게 뭐예요?

이름이 낯설다면, **Framer Motion**이라고 하면 아실 거예요. Framer에서 독립하면서 이름이 Motion으로 바뀌었고, 지금은 React뿐 아니라 바닐라 JS와 Vue에서도 쓸 수 있습니다.

Motion의 핵심은 **스프링 물리**입니다. 애니메이션 시간이나 곡선을 일일이 정하지 않아도 실제 물체처럼 탄력 있게 움직여요. 그래서 "뭔가 어색한데 뭐가 문제인지 모르겠는" 애니메이션이 잘 안 나옵니다.

### 세팅하기

```bash
npm install motion
```

```tsx
import { motion } from "motion/react";
```

기존에 `framer-motion`을 쓰고 있었다면 import 경로만 `motion/react`로 바꿔도 대부분 그대로 동작합니다. Next.js App Router라면 파일 맨 위에 `"use client"`를 잊지 마세요.

### 시각화해보기

일반 태그 앞에 `motion.`만 붙이면 애니메이션이 가능한 컴포넌트가 됩니다.

```tsx
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  눌러보세요
</motion.button>
```

이것만으로 마우스를 올리면 살짝 커지고, 누르면 쏙 들어가는 버튼이 완성됩니다.

스크롤해서 화면에 들어올 때 등장하는 카드도 간단해요.

```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
>
  <Card />
</motion.div>
```

개인적으로 Motion의 진짜 매력은 `layoutId`라고 생각합니다. 탭 메뉴에서 선택된 탭 밑줄이 스르륵 따라다니는 효과, 많이 보셨죠?

```tsx
{active === tab && <motion.div layoutId="underline" className="h-0.5 bg-black" />}
```

같은 `layoutId`를 가진 요소끼리는 Motion이 위치를 자동으로 이어서 움직여 줍니다. 직접 구현하면 위치 계산하느라 한참 걸릴 걸 한 줄로 끝내는 거죠.

---

## anime.js — 각본대로 움직이는 연출

GitHub: [github.com/juliangarnier/anime](https://github.com/juliangarnier/anime)

### 이게 뭐예요?

Motion이 "사용자 행동에 반응하는" 애니메이션에 강하다면, anime.js는 **"정해진 순서대로 보여주는 쇼"**에 강합니다. 랜딩 페이지 인트로, 수십 개의 점이 물결치는 배경, 로고가 펜으로 그려지듯 나타나는 효과 같은 것들이요.

CSS, SVG, DOM 속성, 심지어 일반 JS 객체 값까지 움직일 수 있고, 프레임워크와 상관없이 쓸 수 있습니다.

한 가지 꼭 알아둘 점은, **현재 v4이고 v3과 문법이 완전히 다르다**는 겁니다. 검색해서 나오는 `anime({ targets: ... })` 형태의 예제는 대부분 옛날 버전이라 v4에서는 동작하지 않아요.

### 세팅하기

```bash
npm install animejs
```

```js
import { animate, createTimeline, stagger } from "animejs";
```

v4는 필요한 기능만 골라서 가져오는 방식이라 번들 크기도 가볍게 유지됩니다.

### 시각화해보기

anime.js의 화려함을 가장 쉽게 느낄 수 있는 게 `stagger`(시차)입니다.

```js
animate(".dot", {
  scale: [1, 1.6, 1],
  delay: stagger(60, { grid: [10, 10], from: "center" }),
  loop: true,
});
```

10×10 격자의 점들이 가운데부터 바깥으로 파동처럼 퍼져 나갑니다. 코드 몇 줄로 꽤 그럴듯한 배경이 나와요.

여러 애니메이션을 이어 붙이고 싶을 땐 타임라인을 씁니다.

```js
createTimeline({ defaults: { duration: 700, ease: "outExpo" } })
  .add(".logo", { opacity: [0, 1], scale: [0.6, 1] })
  .add(".title span", { y: [40, 0], opacity: [0, 1], delay: stagger(40) }, "-=300")
  .add(".cta", { opacity: [0, 1] });
```

로고가 등장하고 → 제목 글자가 하나씩 올라오고 → 버튼이 나타나는 인트로 시퀀스입니다. 두 번째 줄의 `"-=300"`은 "이전 애니메이션이 끝나기 300ms 전에 시작하라"는 뜻이에요. 이렇게 겹치는 타이밍을 세밀하게 조절할 수 있다는 게 anime.js가 연출에 강한 이유입니다.

---

## 그래서 뭘 쓰면 될까?

정리하면 이렇습니다.

- **숫자를 보여줘야 한다** → bklit UI
- **사용자 행동에 반응해야 한다** → Motion
- **정해진 연출을 보여줘야 한다** → anime.js

셋을 같이 써도 괜찮습니다. 특히 bklit UI는 이미 Motion을 쓰고 있어서 둘은 궁합이 좋아요. 다만 같은 요소를 Motion과 anime.js가 동시에 움직이면 서로 충돌할 수 있으니, "히어로 섹션은 anime.js, 그 아래 앱 UI는 Motion"처럼 영역을 나눠 쓰는 걸 추천합니다.

움직임은 잘 쓰면 서비스를 한층 고급스럽게 만들어 주지만, 과하면 오히려 피로해집니다. 필요한 곳에 필요한 만큼만 넣는 게 결국 제일 어렵고도 중요한 부분인 것 같아요.

### 참고 링크

- bklit UI — [GitHub](https://github.com/bklit/bklit-ui) · [문서](https://ui.bklit.com/docs)
- Motion — [GitHub](https://github.com/motiondivision/motion) · [문서](https://motion.dev)
- anime.js — [GitHub](https://github.com/juliangarnier/anime) · [문서](https://animejs.com)
