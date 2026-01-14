---
title: 마크다운 렌더러 테스트
description: 커스텀 마크다운 렌더러 테스트 페이지입니다
author: Your Name
keywords:
  - markdown
  - renderer
  - hot-reload
lang: ko
font: Pretendard
theme: min-light
tailwind: true
css:
  - https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css
---

# 🚀 마크다운 렌더러 테스트

이 파일을 수정하면 **실시간**으로 브라우저에 반영됩니다!

## 기능 테스트

### 텍스트 스타일

- **굵은 텍스트**
- *기울임 텍스트*
- ~~취소선~~
- `인라인 코드`

### 코드 블록

```javascript
function hello() {
  console.log('Hello, Markdown!');
}
```

### 인용문

> 이것은 인용문입니다.
> 여러 줄로 작성할 수 있습니다.

### 링크

[GitHub](https://github.com)

### 리스트

1. 첫 번째 항목
2. 두 번째 항목
3. 세 번째 항목

### 테이블

| 기능 | 상태 |
|------|------|
| 렌더링 | ✅ |
| 핫로드 | ✅ |
| 실시간 | ✅ |

### KaTeX

$E=mc^2$
$a^2+b^2=c^2$
$\frac{1}{x^2+1}$
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

### Mermaid 다이어그램

```mermaid
sequenceDiagram
    participant U as 사용자
    participant S as 서버
    participant B as 브라우저
    U->>S: 마크다운 수정
    S->>B: WebSocket 알림
    B->>B: 페이지 새로고침
```

### attrs 플러그인 {.text-4xl .font-bold .text-blue-600}

일반 문단입니다. {.text-gray-700 .leading-relaxed}

- 리스트 아이템 {.text-red-500}
- 다른 아이템

![이미지](./img/test.png){.rounded-xl .shadow-lg .w-full}

[링크](https://example.com){.text-blue-500 .hover:underline #my-link}

> 인용문 {.bg-gray-100 .p-4 .border-l-4 .border-blue-500}

`인라인 코드`{.bg-yellow-100 .px-1 .rounded}

### nested container

::: div {.bg-blue-100 .p-4 .rounded-lg #test-div}
_test_ 텍스트입니다.
:::

:::: div {.grid .grid-cols-2 .gap-4}

::: div {.bg-green-100 .p-4 .rounded}
## 왼쪽
왼쪽 컬럼입니다.
:::

::: div {.bg-red-100 .p-4 .rounded}
## 오른쪽  
오른쪽 컬럼입니다.
:::

::::

### 이모지

:satellite: :rocket:

---

📝 **content** 폴더의 마크다운 파일을 수정해보세요!

---

```md

::: div

text {.attrs}

:::

```

다음과 같은 상황에서는 .attrs가 text가 아닌 div에 적용됩니다.  
이는 attrs의 parent bubbling 때문이니 두 가지 방법 중 하나의 방법을 시도하세요.

### 1. bracketed spans

```md

::: div

[text]{.attrs}

:::

```

### 2. nothing container

```md

::: div

[text]{.attrs}

::: nothing :::

:::

```

nothing container는 실제로 아무 역할도 하지 않습니다.
