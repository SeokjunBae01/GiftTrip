// LikedStore.cjs

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

const _likes = []; 
// { id, countryCode, categoryKey, imageUrl, createdAt }

const korNameByKey = {
  Stay: "도시",
  Activity: "액티비티",
  Food: "음식",
  Spots: "인기 스팟",
};

function addLike({ countryCode = "JP", categoryKey, imageUrl }) {
  if (!categoryKey || !imageUrl) return null;
  const cc = (countryCode || "JP").toUpperCase();    // ✅ 대문자 통일
  const id = makeId();
  const row = {
    id,
    countryCode: cc,
    categoryKey,   // "Stay"|"Activity"|"Food"|"Spots" (서버 라우터에서 이미 normalize됨)
    imageUrl,
    createdAt: Date.now(),
  };
  _likes.push(row);

  console.log("[LikedStore] addLike:", row);          // ✅ 서버 로그
  console.log("[LikedStore] total:", _likes.length);
  return id;
}

function addDislike({ countryCode = "JP", categoryKey, imageUrl }) {
  const cc = (countryCode || "JP").toUpperCase();
  console.log("[LikedStore] addDislike:", { countryCode: cc, categoryKey, imageUrl });
  return true;
}

function getLikes({ countryCode, categoryKey } = {}) {
  let arr = _likes.slice();
  if (countryCode) {
    const cc = countryCode.toUpperCase();             // ✅ 대문자 통일
    arr = arr.filter(x => x.countryCode === cc);
  }
  if (categoryKey) arr = arr.filter(x => x.categoryKey === categoryKey);

  const out = arr.map(x => ({
    ...x,
    categoryName: korNameByKey[x.categoryKey] || x.categoryKey,
  }));
  console.log("[LikedStore] getLikes filter:", { countryCode, categoryKey, outCount: out.length }); // ✅
  return out;
}

function clearLikes() {
  _likes.length = 0;
  console.log("[LikedStore] clearLikes: store cleared"); // ✅
}

// 디버그용 전체 덤프
function dumpLikes() {
  return _likes.slice();
}

module.exports = {
  addLike,
  addDislike,
  getLikes,
  clearLikes,
  dumpLikes, // ✅
};
