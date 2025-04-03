// Function to calculate Levenshtein distance between two strings
function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // Deletion
                matrix[i][j - 1] + 1, // Insertion
                matrix[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    return matrix[a.length][b.length];
}

// Function to check similarity between two strings
function isSimilar(keyword, searchTerm, threshold = 2) {
    return levenshteinDistance(keyword.toLowerCase(), searchTerm.toLowerCase()) <= threshold;
}

document.addEventListener('DOMContentLoaded', async () => {
    const gallery = document.getElementById('image-gallery');
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get('query')?.trim().toLowerCase();

    if (!searchTerm) {
        gallery.innerHTML = '<p>No search term provided.</p>';
        return;
    }

    // Split the search term into multiple keywords
    const searchKeywords = searchTerm.split(/[\s,]+/).filter(Boolean); // Split by spaces or commas

    try {
        // Fetch the JSON file containing image paths and keywords
        const response = await fetch('images.json');
        if (!response.ok) {
            throw new Error('Failed to load image data');
        }

        const imageData = await response.json();

        // Filter and sort images based on the number of matching keywords
        const matchingImages = imageData
            .map(image => ({
                ...image,
                matchCount: image.keywords.filter(keyword =>
                    searchKeywords.some(searchKeyword => isSimilar(keyword, searchKeyword))
                ).length
            }))
            .filter(image => image.matchCount > 0) // Only include images with at least one matching keyword
            .sort((a, b) => b.matchCount - a.matchCount); // Sort by match count in descending order

        if (matchingImages.length === 0) {
            gallery.innerHTML = '<p>No images found for the given keywords.</p>';
            return;
        }

        matchingImages.forEach(image => {
            const card = document.createElement('div'); // Create a card container
            const img = document.createElement('img');
            img.src = image.path;
            img.alt = image.title;

            // Add click event to open the overlay
            card.addEventListener('click', () => showOverlay(image));

            card.appendChild(img); // Add the image to the card
            gallery.appendChild(card); // Add the card to the gallery
        });
    } catch (error) {
        console.error('Error loading images:', error);
        gallery.innerHTML = '<p>Failed to load images. Please try again later.</p>';
    }
});

// Function to fetch the file size of an image
async function fetchFileSize(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            const sizeInKB = (parseInt(contentLength, 10) / 1024).toFixed(2); // Convert bytes to KB
            return `${sizeInKB} KB`;
        }
        return 'Unknown size';
    } catch (error) {
        console.error('Error fetching file size:', error);
        return 'Unknown size';
    }
}

// Function to get the resolution of an image
async function fetchImageResolution(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(`${img.width}x${img.height}`);
        img.onerror = () => resolve('Unknown resolution');
        img.src = url;
    });
}

// Function to show the overlay
async function showOverlay(image) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const content = document.createElement('div');
    content.className = 'overlay-content';

    // Create a container for the image and details
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'overlay-details';

    // Create the PFP card
    const pfpCard = document.createElement('div');
    pfpCard.className = 'pfp-card';

    const img = document.createElement('img');
    img.src = image.path;
    img.alt = image.title;

    // Append the image to the PFP card
    pfpCard.appendChild(img);

    const textContainer = document.createElement('div');
    textContainer.className = 'overlay-text';

    const title = document.createElement('p');
    title.textContent = image.title; // Make the title bigger

    // Fetch the resolution and file size
    const resolution = await fetchImageResolution(image.path);
    const fileSize = await fetchFileSize(image.path);

    // Create a container for size cards
    const sizeContainer = document.createElement('div');
    sizeContainer.className = 'size-container';

    const sizeCard = document.createElement('div');
    sizeCard.className = 'info-card';
    sizeCard.textContent = resolution; // Display the resolution

    const fileSizeCard = document.createElement('div');
    fileSizeCard.className = 'info-card';
    fileSizeCard.textContent = fileSize; // Display the file size

    // Append size cards to the size container
    sizeContainer.appendChild(sizeCard);
    sizeContainer.appendChild(fileSizeCard);

    const downloadButton = document.createElement('button');
    downloadButton.className = 'download-overlay-button';
    downloadButton.textContent = 'Download';
    downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = image.path;
        link.download = image.filename;
        link.click();
    });

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;'; // Use a cross symbol
    closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    // Append details to the text container
    textContainer.appendChild(title);
    textContainer.appendChild(sizeContainer); // Add size container
    textContainer.appendChild(downloadButton);

    // Append the PFP card and text container to the details container
    detailsContainer.appendChild(pfpCard); // Add the PFP card
    detailsContainer.appendChild(textContainer);

    // Create a container for recommendations
    const recommendationsContainer = document.createElement('div');
    recommendationsContainer.className = 'recommendations-container';

    // Fetch recommendations based on matching any keyword
    fetch('images.json')
        .then(response => response.json())
        .then(imageData => {
            const addedPaths = new Set(); // Track already added recommendations
            const recommendations = imageData.filter(img =>
                img.path !== image.path && // Exclude the current image
                img.keywords.some(keyword => image.keywords.includes(keyword)) // Match any keyword
            );

            // Separate recommendations based on whether they match the search term
            const prioritizedRecommendations = recommendations.filter(rec =>
                rec.keywords.some(keyword => !image.keywords.includes(keyword))
            );
            const secondaryRecommendations = recommendations.filter(rec =>
                rec.keywords.some(keyword => image.keywords.includes(keyword))
            );

            // Combine prioritized and secondary recommendations
            const sortedRecommendations = [...prioritizedRecommendations, ...secondaryRecommendations];

            if (sortedRecommendations.length === 0) {
                const noRecommendations = document.createElement('p');
                noRecommendations.textContent = 'No recommendations available.';
                noRecommendations.style.color = '#aaa';
                recommendationsContainer.appendChild(noRecommendations);
            } else {
                sortedRecommendations.forEach(rec => {
                    if (!addedPaths.has(rec.path)) { // Check if the recommendation is already added
                        addedPaths.add(rec.path); // Mark the recommendation as added

                        const recCard = document.createElement('div');
                        recCard.className = 'recommendation-card';

                        const recImg = document.createElement('img');
                        recImg.src = rec.path;
                        recImg.alt = rec.title;
                        recImg.addEventListener('click', () => {
                            document.body.removeChild(overlay);
                            showOverlay(rec); // Show overlay for the clicked recommendation
                        });

                        recCard.appendChild(recImg);
                        recommendationsContainer.appendChild(recCard);
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error fetching recommendations:', error);
        });

    // Append the close button, details container, and recommendations container to the content
    content.appendChild(closeButton);
    content.appendChild(detailsContainer);
    content.appendChild(recommendationsContainer);

    // Append the content to the overlay
    overlay.appendChild(content);

    // Append the overlay to the body and ensure it is visible
    document.body.appendChild(overlay);
}
