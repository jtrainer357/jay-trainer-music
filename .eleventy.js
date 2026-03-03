module.exports = function (eleventyConfig) {
  // Passthrough copy
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/llms.txt");

  // Date filters
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    const d = new Date(dateObj);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return new Date(dateObj).toISOString();
  });

  eleventyConfig.addFilter("w3Date", (dateObj) => {
    const d = dateObj === "now" || !dateObj ? new Date() : new Date(dateObj);
    return d.toISOString().split("T")[0];
  });

  // Reading time filter
  eleventyConfig.addFilter("readingTime", (content) => {
    const words = (content || "").split(/\s+/).length;
    const minutes = Math.ceil(words / 230);
    return `${minutes} min read`;
  });

  // Word count filter
  eleventyConfig.addFilter("wordCount", (content) => {
    return (content || "").split(/\s+/).filter(Boolean).length;
  });

  // Previous/Next post navigation
  eleventyConfig.addFilter("getPrevNext", (collection, page) => {
    const sorted = [...collection].sort((a, b) => a.date - b.date);
    const index = sorted.findIndex((p) => p.url === page.url);
    return {
      prev: index > 0 ? sorted[index - 1] : null,
      next: index < sorted.length - 1 ? sorted[index + 1] : null,
    };
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

  // Current year filter
  eleventyConfig.addFilter("currentYear", () => {
    return new Date().getFullYear();
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
