const path = require("path");

// 전역 카테고리 목록
const categories = ["Stay", "Activity", "Food", "Spots"];

// 전역 카테고리 이미지 경로
const categoriesPicture = {
  Stay: [
    path.join(__dirname, "../public/Picture/Stay/stay1.png"),
    path.join(__dirname, "../public/Picture/Stay/stay2.png"),
  ],
  Activity: [
    path.join(__dirname, "../public/Picture/Activity/activity1.png"),
    path.join(__dirname, "../public/Picture/Activity/activity2.png"),
  ],
  Food: [
    path.join(__dirname, "../public/Picture/Food/food1.png"),
    path.join(__dirname, "../public/Picture/Food/food2.png"),
  ],
  Spots: [
    path.join(__dirname, "../public/Picture/Spots/spot1.png"),
    path.join(__dirname, "../public/Picture/Spots/spot2.png"),
  ],
};

// 인덱스로 카테고리 이름 가져오기
function getCategoryName(index) {
  return categories[index] || null;
}

// 카테고리명으로 이미지 경로 배열 가져오기
function getCategoryPictures(categoryName) {
  return categoriesPicture[categoryName] || [];
}

// 카테고리명으로 이미지 개수 가져오기
function getCategoryPictureCount(categoryName) {
  return categoriesPicture[categoryName]
    ? categoriesPicture[categoryName].length
    : 0;
}

module.exports = {
  categories,
  categoriesPicture,
  getCategoryName,
  getCategoryPictures,
  getCategoryPictureCount, // ← 이거 추가!
};