// LikedStore.cjs

// uuid 없이 간단한 ID 생성기
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// 인메모리 저장
const _likes = []; 
// 항목 구조: { id, countryCode, categoryKey, imageUrl, createdAt }

const korNameByKey = {
  Stay: "숙박",
  Activity: "액티비티",
  Food: "음식",
  Spots: "인기 스팟", // Page06 탭 표기와 통일
};

function addLike({ countryCode = "JP", categoryKey, imageUrl }) {
  if (!categoryKey || !imageUrl) return null;
  const id = makeId();
  _likes.push({
    id,
    countryCode,
    categoryKey,   // "Stay"|"Activity"|"Food"|"Spots"
    imageUrl,
    createdAt: Date.now(),
  });
  return id;
}

function addDislike({ countryCode = "JP", categoryKey, imageUrl }) {
  // 필요 시 기록, 아니면 no-op
  return true;
}

function getLikes({ countryCode, categoryKey } = {}) {
  let arr = _likes.slice();
  if (countryCode) arr = arr.filter(x => x.countryCode === countryCode);
  if (categoryKey) arr = arr.filter(x => x.categoryKey === categoryKey);
  return arr.map(x => ({
    ...x,
    categoryName: korNameByKey[x.categoryKey] || x.categoryKey,
  }));
}

function clearLikes() {
  _likes.length = 0; // 전체 초기화
}

module.exports = {
  addLike,
  addDislike,
  getLikes,
  clearLikes,
};