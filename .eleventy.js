module.exports = function (eleventyConfig) {
  // Passthrough copy
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/llms.txt");

  // Date filters
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    const d = new Date(dateObj);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return new Date(dateObj).toISOString();
  });

  // Reading time filter
  eleventyConfig.addFilter("readingTime", (content) => {
    const words = (content || "").split(/\s+/).length;
    const minutes = Math.ceil(words / 230);
    return `${minutes} min read`;
  });

  // Slug filter (for matching data)
  eleventyConfig.addFilter("slug", (str) => {
    return (str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  });

  // Find release by slug
  eleventyConfig.addFilter("findBySlug", (collection, slug) => {
    return collection.find((item) => item.slug === slug);
  });

  // Limit filter
  eleventyConfig.addFilter("limit", (arr, count) => {
    return (arr || []).slice(0, count);
  });

  // Exclude filter
  eleventyConfig.addFilter("exclude", (arr, slug) => {
    return (arr || []).filter((item) => item.slug !== slug);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
