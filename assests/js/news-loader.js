/**
 * K-WAVE MISSION - Dynamic News Loader
 * Fetches local .md files and renders them as HTML.
 */
async function loadNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    try {
        // Fetch metadata first to know what to load
        const response = await fetch('/posts/posts.json');
        const posts = await response.json();

        let htmlContent = '';
        posts.forEach(post => {
            htmlContent += `
                <div class="border-b border-gray-100 py-6">
                    <span class="text-xs font-bold text-cyan-500">${post.date}</span>
                    <h3 class="text-xl font-bold mt-1 hover:text-cyan-600 transition cursor-pointer" 
                        onclick="location.href='post.html?id=${encodeURIComponent(post.file)}'">
                        ${post.title}
                    </h3>
                </div>
            `;
        });
        newsContainer.innerHTML = htmlContent;
    } catch (err) {
        console.error("Failed to load news:", err);
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', loadNews);
