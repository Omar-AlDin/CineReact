import { useState, useEffect, useRef } from "react";

import "./App.css";

const BASE_URL = "https://bold-wood-ed55.o01604672.workers.dev/api";

// const options = {
//   method: "GET",
//   headers: {
//     accept: "application/json",
//   },
// };

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(false);
  const [modal, setModal] = useState(null);

  useEffect(
    function () {
      let cancelled = false;
      // console.log(page);
      async function fetchTrending() {
        loadingRef.current = true;
        setIsLoading(true);
        try {
          const res = await fetch(`${BASE_URL}/trending/all/day?page=${page}`);
          const data = await res.json();
          console.log(data);

          if (!cancelled) {
            setItems(function (preItems) {
              const seen = new Set(
                preItems.map((item) => `${item.media_type}-${item.id}`),
              );

              const uniqueItems = [];

              for (const item of data.results) {
                const key = `${item.media_type}-${item.id}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  uniqueItems.push(item);
                }
              }

              return [...preItems, ...uniqueItems];
            });
          }
        } catch (err) {
          console.error("Failed to fetch trending: ", err);
        } finally {
          if (!cancelled) {
            loadingRef.current = false;
            setIsLoading(false);
          }
        }
      }
      fetchTrending();
      return function () {
        cancelled = true;
      };
    },
    [page],
  );

  useEffect(() => {
    function handleScroll() {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 500 &&
        !loadingRef.current
      ) {
        loadingRef.current = true;
        setPage((prePage) => prePage + 1);
      }
    }
    window.addEventListener("scroll", handleScroll);

    return function () {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="home-page">
      <div>
        <Searchbar />
      </div>
      <div className="movie-grid">
        {items.map((item, index) => (
          <MovieCard
            item={item}
            key={`${item.id}-${index}`}
            onSelectModal={setModal}
          />
        ))}
      </div>
      {isLoading && (
        <p style={{ color: "white", textAlign: "center" }}>Loading more...</p>
      )}
      {!isLoading && (
        <div style={{ textAlign: "center", margin: "30px 0" }}>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Load More Movies
          </button>
        </div>
      )}
      {modal && <DetailsPage modal={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

function MovieCard({ item, onSelectModal }) {
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : "placeholder.jpg";
  return (
    <div className="movie-card" onClick={() => onSelectModal(item)}>
      <img src={posterUrl} alt={item.title || item.name} />
    </div>
  );
}

function Searchbar() {
  return (
    <div className="search-bar">
      <input type="text" placeholder="Search movies or TV shows..."></input>
    </div>
  );
}

function DetailsPage({ modal, onClose }) {
  console.log(modal);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="details-page" onClick={(e) => e.stopPropagation()}>
        <Title modal={modal} />
        <PosterAndTrailer modal={modal} />
        <Rating modal={modal} />
        <Overview modal={modal} />
        <Creators modal={modal} />
        <Cast modal={modal} />
        <UserRating modal={modal} />
        <MetaData modal={modal} />
      </div>
    </div>
  );
}
function Title({ modal }) {
  const mediaType = modal.media_type === "tv" ? modal.name : modal.title;
  return (
    <div className="title">
      <h2>{mediaType}</h2>
    </div>
  );
}
function PosterAndTrailer({ modal }) {
  function handleMedia(media, size = "w500") {
    console.log(media);
    return modal[media]
      ? `https://image.tmdb.org/t/p/${size}${modal[media]}`
      : "placeholder.jpg";
  }

  return (
    <div className="poster">
      <img src={handleMedia("poster_path")} />
      <div className="trailer">
        <img src={handleMedia("backdrop_path", "w780")} />
      </div>
    </div>
  );
}

function Rating({ modal }) {
  return (
    <div className="rating">
      <p>
        <strong>⭐ {modal.vote_average.toFixed(1)}</strong>
        /10
      </p>
    </div>
  );
}

function Overview({ modal }) {
  return (
    <div className="overview">
      <div className="overview-header">
        <h3>Overview</h3>
      </div>
      <div className="overview-main">
        <p>{modal.overview}</p>
      </div>
    </div>
  );
}

function Creators({ modal }) {
  const [names, setNames] = useState({});
  useEffect(
    function () {
      let cancelled = false;
      async function creators() {
        try {
          const url =
            modal.media_type === "tv"
              ? `${BASE_URL}/${modal.media_type}/${modal.id}`
              : `${BASE_URL}/${modal.media_type}/${modal.id}/credits`;

          const res = await fetch(url);
          const data = await res.json();
          console.log("RRR:", data);
          if (!cancelled) {
            if (modal.media_type === "tv") {
              const creator = data?.created_by?.map((c) => c.name).join(", ");
              setNames({ creator });
            } else {
              const director = [
                ...new Set(
                  data?.crew
                    ?.filter((d) => d.job === "Director")
                    .map((d) => d.name),
                ),
              ].join(", ");

              const writer = [
                ...new Set(
                  data?.crew
                    ?.filter(
                      (d) => d.job === "Screenplay" || d.job === "Writer",
                    )
                    .map((d) => d.name),
                ),
              ].join(", ");

              setNames({ director, writer });
            }
          }
        } catch (err) {
          console.error("Failed fetching creators: ", err);
        }
      }
      creators();
      return function () {
        cancelled = true;
      };
    },
    [modal.media_type, modal.id],
  );
  return (
    <div className="creator">
      {modal.media_type === "tv" && (
        <p>
          <strong>Created By: </strong>
          <span>{names.creator}</span>
        </p>
      )}
      {modal.media_type === "movie" && (
        <p>
          <strong>Directors: </strong>
          <span>{names.director}</span>
        </p>
      )}

      {modal.media_type === "movie" && (
        <p>
          <strong>Writers: </strong>
          <span>{names.writer}</span>
        </p>
      )}
    </div>
  );
}
function Cast({ modal }) {
  const [cast, setCast] = useState([]);

  useEffect(
    function () {
      let cancelled = false;
      async function fetchCast() {
        try {
          const res = await fetch(
            `${BASE_URL}/${modal.media_type}/${modal.id}/credits`,
          );
          const data = await res.json();
          if (!cancelled) setCast(data.cast.slice(0, 10));
          console.log(data);
        } catch (err) {
          console.error("Failed to fetch cast: ", err);
        }
      }
      fetchCast();
      return function () {
        cancelled = true;
      };
    },
    [modal.id, modal.media_type],
  );
  console.log("Current modal", cast);

  return (
    <div className="cast">
      <h2>Cast</h2>
      <div className="cast-list">
        {cast.map((person) => (
          <div className="cast-member" key={person.id}>
            <img
              src={
                person.profile_path
                  ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                  : `placeholder.jpg`
              }
              alt={cast.original_name}
            />
            <p>{person.name}</p>
            <p className="character-name">{person.character}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserRating() {
  return (
    <div className="user-rating">
      <h3>Your Rating</h3>
    </div>
  );
}

//Formaters
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function MetaData({ modal }) {
  const [details, setDetails] = useState(null);
  useEffect(
    function () {
      let cancelled = false;
      async function fetchTvDetails() {
        try {
          const res = await fetch(
            `${BASE_URL}/${modal.media_type}/${modal.id}`,
          );
          const data = await res.json();
          if (!cancelled) {
            console.log("Whole Data", data);
            setDetails(data);
          }
        } catch (err) {
          console.error("Failed feching TV details: ", err);
        }
      }
      fetchTvDetails();
      return function () {
        cancelled = true;
      };
    },
    [modal.id, modal.media_type],
  );
  if (!details) return null;
  return (
    <div>
      <h3>Details</h3>
      <div className={modal.media_type}>
        {modal.media_type === "tv" && details.number_of_seasons > 0 && (
          <p>
            <strong>Total Seasons: </strong>
            <span>{details.number_of_seasons}</span>
          </p>
        )}

        {modal.media_type === "tv" && details.number_of_episodes > 0 && (
          <p>
            <strong>Total Episodes: </strong>
            <span>{details.number_of_episodes}</span>
          </p>
        )}

        {modal.media_type === "tv" && details?.networks?.length > 0 && (
          <p>
            <strong>Networks: </strong>
            <span>{details.networks.map((n) => n.name).join(", ")}</span>
          </p>
        )}
        {modal.media_type === "tv" && details.origin_country.length > 0 && (
          <p>
            <strong>Country: </strong>

            <span>
              {details.origin_country
                .map((code) => regionNames.of(code))
                .join(", ")}
            </span>
          </p>
        )}

        {modal.media_type === "tv" && details.original_language && (
          <p>
            <strong>Language: </strong>

            <span>{languageNames.of(details.original_language)}</span>
          </p>
        )}

        {modal.media_type === "tv" && details.first_air_date && (
          <p>
            <strong>Air Date: </strong>

            <span>{details.first_air_date}</span>
          </p>
        )}

        {modal.media_type === "movie" && details.origin_country && (
          <p>
            <strong>Country: </strong>

            <span>
              {details.origin_country.map((code) => regionNames.of(code))}
            </span>
          </p>
        )}

        {modal.media_type === "movie" && details.original_language && (
          <p>
            <strong>Language: </strong>

            <span>{languageNames.of(details.original_language)}</span>
          </p>
        )}

        {modal.media_type === "movie" && details.budget > 0 && (
          <p>
            <strong>Budget: </strong>

            <span>{currencyFormatter.format(details.budget)}</span>
          </p>
        )}

        {modal.media_type === "movie" && details.revenue > 0 && (
          <p>
            <strong>Revenue: </strong>

            <span>{currencyFormatter.format(details.revenue)}</span>
          </p>
        )}

        {modal.media_type === "movie" && details.release_date && (
          <p>
            <strong>Release Date: </strong>

            <span>{details.release_date}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
