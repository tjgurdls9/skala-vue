<template>
  <div class="practice-section delivery-practice">
    <h2>코드 품질과 배포 확인</h2>
    <p>교재 270~273p의 터미널 실습을 현재 프로젝트 설정과 배포 결과로 확인했습니다.</p>
    <ul>
      <li><strong>ESLint</strong><span>npm run lint</span></li>
      <li><strong>Prettier</strong><span>npm run format</span></li>
      <li><strong>환경 변수</strong><span>.env.example · Vercel Production</span></li>
      <li><strong>프로덕션 빌드</strong><span>npm run build · dist/ 생성</span></li>
      <li><strong>호스팅</strong><span>Vercel SPA rewrite 적용</span></li>
    </ul>
  </div>
</template>

<style scoped>
.delivery-practice p {
  margin: 0 0 14px;
  color: #4e5968;
}
.delivery-practice ul {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid rgba(28, 32, 56, 0.08);
}
.delivery-practice li {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 11px 2px;
  border-bottom: 1px solid rgba(28, 32, 56, 0.08);
  font-size: 14px;
}
.delivery-practice span {
  color: #5f6b7a;
  text-align: right;
}
</style>
