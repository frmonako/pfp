document.querySelector('.search-bar').addEventListener('focus', () => {
    document.querySelector('.search-wrapper').classList.add('active');
});

document.querySelector('.search-bar').addEventListener('blur', () => {
    document.querySelector('.search-wrapper').classList.remove('active');
});

document.querySelector('.search-bar').addEventListener('keydown', handleSearch);

document.querySelector('.search-button').addEventListener('click', async () => {
    const gallery = document.getElementById('layout-gallery');
    gallery.innerHTML = ''; // Clear previous images

    const searchTerm = document.querySelector('.search-bar').value.trim().toLowerCase();

    // Split the search term into multiple keywords
    const searchKeywords = searchTerm.split(/[\s,]+/).filter(Boolean); // Split by spaces or commas

    try {
        // Fetch the JSON file containing image paths and keywords
        const response = await fetch('images.json');
        if (!response.ok) {
            throw new Error('Failed to load image data');
        }

        const imageData = await response.json();

        // Filter images based on the search keywords
        const matchingImages = imageData.filter(image =>
            image.keywords.some(keyword =>
                searchKeywords.some(searchKeyword => keyword.toLowerCase().includes(searchKeyword))
            )
        );

        if (matchingImages.length === 0) {
            gallery.innerHTML = '<p>No images found for the given keywords.</p>';
            return;
        }

        matchingImages.forEach(image => {
            const div = document.createElement('div');
            const img = document.createElement('img');
            img.src = image.path;
            img.alt = 'Gallery Image';

            const button = document.createElement('button');
            button.className = 'download-button';
            button.textContent = 'Download';
            button.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = image.path;
                link.download = image.filename;
                link.click();
            });

            div.appendChild(img);
            div.appendChild(button);
            gallery.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading images:', error);
        gallery.innerHTML = '<p>Failed to load images. Please try again later.</p>';
    }
});

document.querySelectorAll('.image-gallery div').forEach(card => {
    card.addEventListener('click', () => {
        const img = card.querySelector('img');
        const image = {
            path: img.src,
            title: img.alt,
            filename: img.src.split('/').pop()
        };
        showOverlay(image); // Open the overlay when clicking the PFP
    });
});

function handleSearch(event) {
    if (event.key === 'Enter') {
        const searchTerm = event.target.value.trim();
        if (searchTerm) {
            window.location.href = `search.html?query=${encodeURIComponent(searchTerm)}`;
        }
    }
}
