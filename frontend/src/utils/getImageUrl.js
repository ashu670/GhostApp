const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  // Cloudinary or any external URL
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // fallback (just in case local is used)
  return `${import.meta.env.VITE_API_URL}/uploads/${imagePath}`;
};

export default getImageUrl;