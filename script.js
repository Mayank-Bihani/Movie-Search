const apiKey = 'a78221f6';
const searchForm = document.getElementById('search-form');
const movieTitleInput = document.getElementById('movie-title');
const movieDetailsDiv = document.getElementById('movie-details');
let currentPage = 1;
let totalPages = 1;
let previousSearchResults = [];

searchForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const movieTitle = movieTitleInput.value;
  if (movieTitle.trim() === '') {
    alert('Please enter a movie title');
    return;
  }

  currentPage = 1; // Reset the current page to 1 for new searches
  fetchMovies(movieTitle, currentPage);
});

function fetchMovies(movieTitle, page) {
  const apiUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(
    movieTitle
  )}&page=${page}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.Response === 'True') {
        totalPages = Math.ceil(data.totalResults / 10);
        previousSearchResults = data.Search;
        displayMovieResults(data.Search);
      } else {
        alert('No movies found!');
      }
    })
    .catch(error => console.error('Error fetching data:', error));
}

function displayMovieResults(movies) {
  movieDetailsDiv.innerHTML = '';

  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');

    const posterImg = movie.Poster === 'N/A' ? 'placeholder.png' : movie.Poster;

    movieCard.innerHTML = `
      <h2 class="movie-title" data-imdbid="${movie.imdbID}">${movie.Title} (${movie.Year})</h2>
      <p><strong>Type:</strong> ${movie.Type}</p>
      <p><strong>IMDB ID:</strong> ${movie.imdbID}</p>
      <img src="${posterImg}" alt="${movie.Title} Poster" width="200">
      <p class="viewMore" data-imdbid="${movie.imdbID}">View More</p>
    `;

    movieDetailsDiv.appendChild(movieCard);
  });

  movieDetailsDiv.style.display = 'block';

  // Attach click event to movie titles
  const movieTitles = document.querySelectorAll('.viewMore');
  movieTitles.forEach(title => {
    title.addEventListener('click', function () {
      const imdbID = this.getAttribute('data-imdbid');
      fetchMovieDetails(imdbID);
    });
  });

  // Add pagination controls
  addPaginationControls();
}

function addPaginationControls() {
  const paginationDiv = document.createElement('div');
  paginationDiv.classList.add('pagination');

  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', function () {
    if (currentPage > 1) {
      currentPage--;
      fetchMovies(movieTitleInput.value, currentPage);
    }
  });

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', function () {
    if (currentPage < totalPages) {
      currentPage++;
      fetchMovies(movieTitleInput.value, currentPage);
    }
  });

  const pageInput = document.createElement('input');
  pageInput.type = 'text';
  pageInput.placeholder=` / ${totalPages}`;
  pageInput.value = currentPage;
  pageInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      const pageNumber = parseInt(pageInput.value, 10);
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        currentPage = pageNumber;
        fetchMovies(movieTitleInput.value, currentPage);
      }
    }
  });

  paginationDiv.appendChild(prevButton);
  paginationDiv.appendChild(pageInput);
  paginationDiv.appendChild(nextButton);
  movieDetailsDiv.appendChild(paginationDiv);
}

function fetchMovieDetails(imdbID) {
  const apiUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => displayMovieDetails(data))
    .catch(error => console.error('Error fetching data:', error));
}

function displayMovieDetails(movieData) {
  const movieKey = `movie_${movieData.imdbID}`;

  // Get the stored rating and comment for the movie from local storage
  const storedData = JSON.parse(localStorage.getItem(movieKey)) || { rating: null, comment: null };
  
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to Search Results';
  backButton.addEventListener('click', function () {
    movieDetailsDiv.style.display = 'none';
    displayMovieResults(previousSearchResults);
  });

  const starRatingDiv = document.createElement('div');
  starRatingDiv.classList.add('star-rating');

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.innerHTML = '&#9733;'; // Unicode star symbol
    star.dataset.rating = i;
    stars.push(star);
    starRatingDiv.appendChild(star);
  }
  function updateStarRating(selectedRating) {
    stars.forEach((star, index) => {
      star.classList.toggle('selected', index < selectedRating);
    });
  }
  // Set the selected rating based on the stored data
  const selectedRating = storedData.rating;
  if (selectedRating) {
    updateStarRating(selectedRating);
  }

  starRatingDiv.addEventListener('click', function (event) {
    const selectedStar = event.target;
    if (selectedStar.tagName === 'SPAN') {
      const rating = parseInt(selectedStar.dataset.rating, 10);
      if (rating >= 1 && rating <= 5) {
        // Update the UI for selected star
        updateStarRating(rating);

        // Store the rating in local storage
        storedData.rating = rating;
        localStorage.setItem(movieKey, JSON.stringify(storedData));
      }
    }
  });

  const commentInput = document.createElement('textarea');
  commentInput.placeholder = 'Leave a comment';
  commentInput.value = storedData.comment || '';
  commentInput.addEventListener('input', function () {
    // Store the comment in local storage
    storedData.comment = commentInput.value;
    localStorage.setItem(movieKey, JSON.stringify(storedData));
  });

  const ratingCommentDiv = document.createElement('div');
  ratingCommentDiv.classList.add('rating-comment');
  ratingCommentDiv.appendChild(starRatingDiv );
  ratingCommentDiv.appendChild(commentInput);

  movieDetailsDiv.innerHTML = `
    <h2>${movieData.Title} (${movieData.Year})</h2>
    <img src="${movieData.Poster}" alt="${movieData.Title} Poster" width="200">
    <p><strong>Rated:</strong> ${movieData.Rated}</p>
    <p><strong>Released:</strong> ${movieData.Released}</p>
    <p><strong>Runtime:</strong> ${movieData.Runtime}</p>
    <p><strong>Genre:</strong> ${movieData.Genre}</p>
    <p><strong>Director:</strong> ${movieData.Director}</p>
    <p><strong>Writer:</strong> ${movieData.Writer}</p>
    <p><strong>Actors:</strong> ${movieData.Actors}</p>
    <p><strong>Plot:</strong> ${movieData.Plot}</p>
    <p><strong>Language:</strong> ${movieData.Language}</p>
    <p><strong>Country:</strong> ${movieData.Country}</p>
    <p><strong>Awards:</strong> ${movieData.Awards}</p>
    <p><strong>Metascore:</strong> ${movieData.Metascore}</p>
    <p><strong>imdbRating:</strong> ${movieData.imdbRating}</p>
    <p><strong>imdbVotes:</strong> ${movieData.imdbVotes}</p>
    <p><strong>imdbID:</strong> ${movieData.imdbID}</p>
    <p><strong>Type:</strong> ${movieData.Type}</p>
    <p><strong>DVD:</strong> ${movieData.DVD}</p>
    <p><strong>BoxOffice:</strong> ${movieData.BoxOffice}</p>
    <p><strong>Production:</strong> ${movieData.Production}</p>
    <p><strong>Website:</strong> ${movieData.Website}</p>
  `;

  movieDetailsDiv.appendChild(ratingCommentDiv);
  movieDetailsDiv.appendChild(backButton);
  movieDetailsDiv.style.display = 'block';
}
