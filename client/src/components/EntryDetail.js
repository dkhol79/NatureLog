import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";
import SideNav from "./SideNav";
import "@fortawesome/fontawesome-free/css/all.min.css";

const EntryDetail = ({ token }) => {
  const [entry, setEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const { id } = useParams();
  const history = useHistory();

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/journal/${id}`, config);
        setEntry(res.data);

        if (token) {
          // Fetch current user data to get their ID
          const accountRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/account`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Compare current user's ID with entry's userId
          setIsOwner(accountRes.data._id === res.data.userId);
        }
      } catch (err) {
        console.error("Error fetching entry:", err.response?.data || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          history.push("/login");
        } else {
          history.push("/");
        }
      }
    };

    const fetchEntries = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/journal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(res.data);
      } catch (err) {
        console.error("Error fetching entries:", err.response?.data || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          history.push("/login");
        }
      }
    };

    fetchEntry();
    fetchEntries();
  }, [id, token, history]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    history.push("/login");
  };

  const handleCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  const prepareContentForEditing = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const images = doc.querySelectorAll("img");
    images.forEach((img) => {
      if (img.parentElement.className === "resizable-image-container") return;

      const container = doc.createElement("div");
      container.className = "resizable-image-container";
      container.contentEditable = false;

      const resizeHandles = ["top-left", "top-right", "bottom-left", "bottom-right"];
      resizeHandles.forEach((position) => {
        const handle = doc.createElement("div");
        handle.className = `resize-handle ${position}`;
        container.appendChild(handle);
      });

      img.parentNode.insertBefore(container, img);
      container.appendChild(img);
    });

    const editableDiv = doc.createElement("div");
    editableDiv.contentEditable = true;
    editableDiv.className = "editable-content";
    while (doc.body.firstChild) {
      editableDiv.appendChild(doc.body.firstChild);
    }
    doc.body.appendChild(editableDiv);

    return doc.body.innerHTML;
  };

  const stripContentEditable = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    doc.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    doc.querySelectorAll(".resizable-image-container").forEach((container) => {
      const img = container.querySelector("img");
      if (img) container.replaceWith(img);
    });

    return doc.body.innerHTML;
  };

  const handleEdit = () => {
    if (!token) {
      console.log("No token provided, cannot edit");
      return;
    }
    if (!isOwner) {
      console.log("User is not the owner, cannot edit");
      return;
    }
    const editableContent = prepareContentForEditing(entry.content);
    history.push("/journal", { entryToEdit: { ...entry, content: editableContent } });
  };

  const handleDelete = async () => {
    if (!token) {
      console.log("No token provided, cannot delete");
      return;
    }
    if (!isOwner) {
      console.log("User is not the owner, cannot delete");
      return;
    }
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/journal/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(entries.filter((e) => e._id !== id));
        history.push("/journal");
      } catch (err) {
        console.error("Delete request failed:", err.response?.data || err.message);
        let errorMessage = "Failed to delete entry. Please try again.";
        if (err.response?.status === 403) errorMessage = "You do not have permission to delete this entry.";
        else if (err.response?.status === 404) errorMessage = "Entry not found.";
        else if (err.response?.status === 401) {
          handleLogout();
          return;
        }
        alert(errorMessage);
      }
    }
  };

  useEffect(() => {
    if (!entry || !token || !isOwner) return;
    const containers = document.querySelectorAll(".resizable-image-container");
    containers.forEach((container) => {
      const img = container.querySelector("img");
      const handles = container.querySelectorAll(".resize-handle");

      handles.forEach((handle) => {
        handle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = img.offsetWidth;
          const startHeight = img.offsetHeight;

          const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            if (handle.classList.contains("top-left")) {
              img.style.width = `${startWidth - dx}px`;
              img.style.height = `${startHeight - dy}px`;
            } else if (handle.classList.contains("top-right")) {
              img.style.width = `${startWidth + dx}px`;
              img.style.height = `${startHeight - dy}px`;
            } else if (handle.classList.contains("bottom-left")) {
              img.style.width = `${startWidth - dx}px`;
              img.style.height = `${startHeight + dy}px`;
            } else if (handle.classList.contains("bottom-right")) {
              img.style.width = `${startWidth + dx}px`;
              img.style.height = `${startHeight + dy}px`;
            }
          };

          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
      });
    });
  }, [entry, token, isOwner]);

  if (!entry) return (
    <div className="loading">
      <span>Loading...</span>
    </div>
  );

  return (
    <div className="app-container">
      <SideNav
        token={token}
        entries={entries}
        handleLogout={handleLogout}
        handleCardClick={handleCardClick}
      />
      <main className="main-content">
        <div className="entry-detail-container">
          <div className="entry-detail-header">
            <button onClick={() => history.goBack()} className="back-btn">
              Back
            </button>
            {token && isOwner && (
              <button onClick={handleEdit} className="edit-btn">
                Edit
              </button>
            )}
          </div>
          <div className="entry-detail-content">
            <div className="entry-header">
              <p className="entry-date">{entry.date}</p>
              <h2>{entry.title}</h2>
            </div>
            {entry.photos?.length > 0 && (
              <div className="media-gallery">
                {entry.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={`${process.env.REACT_APP_API_URL}/${photo}`}
                    alt={`${entry.title} ${index}`}
                    className="media-item"
                  />
                ))}
              </div>
            )}
            {entry.videos?.length > 0 && (
              <div className="media-gallery">
                {entry.videos.map((video, index) => (
                  <video
                    key={index}
                    controls
                    src={`${process.env.REACT_APP_API_URL}/${video}`}
                    className="media-item"
                  />
                ))}
              </div>
            )}
            {entry.audio && (
              <audio
                controls
                src={`${process.env.REACT_APP_API_URL}/${entry.audio}`}
                className="audio-player"
              />
            )}
            <div
              className="description"
              dangerouslySetInnerHTML={{ __html: stripContentEditable(entry.content) }}
            />
            <div className="entry-meta">
              <p><strong>Category:</strong> {entry.category}</p>
              {entry.weather && (
                <div className="weather-details">
                  <h3>
                    Weather Conditions{" "}
                    <span className="cloud-cover-title">
                      <i className="fas fa-cloud weather-icon"></i>{" "}
                      {entry.weather.clouds?.all ?? "N/A"}%
                    </span>
                  </h3>
                  <div className="weather-columns">
                    <div className="weather-column">
                      <div className="weather-card">
                        <p>
                          <i className="fas fa-cloud-sun weather-icon"></i>
                          <strong>Main:</strong>{" "}
                          <span>{entry.weather.weather?.[0]?.main ?? "N/A"}</span>
                        </p>
                        <p>
                          <i className="fas fa-info-circle weather-icon"></i>
                          <strong>Description:</strong>{" "}
                          <span>{entry.weather.weather?.[0]?.description ?? "N/A"}</span>
                        </p>
                        <p>
                          <i className="fas fa-thermometer-half weather-icon"></i>
                          <strong>Temperature:</strong>{" "}
                          <span>
                            {entry.weather.main?.temp
                              ? ((entry.weather.main.temp - 273.15) * 9/5 + 32).toFixed(1) + "°F"
                              : "N/A"}
                          </span>
                        </p>
                        <p>
                          <i className="fas fa-temperature-low weather-icon"></i>
                          <strong>Feels Like:</strong>{" "}
                          <span>
                            {entry.weather.main?.feels_like
                              ? ((entry.weather.main.feels_like - 273.15) * 9/5 + 32).toFixed(1) + "°F"
                              : "N/A"}
                          </span>
                        </p>
                        <p>
                          <i className="fas fa-temperature-down weather-icon"></i>
                          <strong>Min Temp:</strong>{" "}
                          <span>
                            {entry.weather.main?.temp_min
                              ? ((entry.weather.main.temp_min - 273.15) * 9/5 + 32).toFixed(1) + "°F"
                              : "N/A"}
                          </span>
                        </p>
                        <p>
                          <i className="fas fa-temperature-up weather-icon"></i>
                          <strong>Max Temp:</strong>{" "}
                          <span>
                            {entry.weather.main?.temp_max
                              ? ((entry.weather.main.temp_max - 273.15) * 9/5 + 32).toFixed(1) + "°F"
                              : "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="weather-column">
                      <div className="weather-card">
                        <p>
                          <i className="fas fa-tachometer-alt weather-icon"></i>
                          <strong>Pressure:</strong>{" "}
                          <span>
                            {entry.weather.main?.pressure
                              ? (entry.weather.main.pressure * 0.02953).toFixed(2) + " inHg"
                              : "N/A"}
                          </span>
                        </p>
                        <p>
                          <i className="fas fa-tint weather-icon"></i>
                          <strong>Humidity:</strong>{" "}
                          <span>{entry.weather.main?.humidity ?? "N/A"}%</span>
                        </p>
                        <p>
                          <i className="fas fa-eye weather-icon"></i>
                          <strong>Visibility:</strong>{" "}
                          <span>
                            {entry.weather.visibility
                              ? (entry.weather.visibility / 1609.34).toFixed(1) + " mi"
                              : "N/A"}
                          </span>
                        </p>
                        <p>
                          <i className="fas fa-wind weather-icon"></i>
                          <strong>Wind Speed:</strong>{" "}
                          <span>
                            {entry.weather.wind?.speed
                              ? (entry.weather.wind.speed * 2.23694).toFixed(1) + " mph"
                              : "N/A"}
                          </span>
                        </p>
                        <p>
                          <i
                            className="fas fa-compass weather-icon"
                            style={{ transform: `rotate(${entry.weather.wind?.deg ?? 0}deg)` }}
                          ></i>
                          <strong>Wind Direction:</strong>{" "}
                          <span>{entry.weather.wind?.deg ?? "N/A"}°</span>
                        </p>
                        <p>
                          <i className="fas fa-wind weather-icon wind-gust"></i>
                          <strong>Wind Gust:</strong>{" "}
                          <span>
                            {entry.weather.wind?.gust
                              ? (entry.weather.wind.gust * 2.23694).toFixed(1) + " mph"
                              : "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!entry.weather && (
                <p><strong>Weather:</strong> Not available</p>
              )}
              <p><strong>Location:</strong> {entry.location || "Unknown"}</p>
              <p>
                <strong>Coordinates:</strong>{" "}
                {entry.geolocation?.lat && entry.geolocation?.lng
                  ? `Lat: ${parseFloat(entry.geolocation.lat).toFixed(4)}°, Lng: ${parseFloat(
                      entry.geolocation.lng
                    ).toFixed(4)}°`
                  : "Not available"}
              </p>
              <p><strong>By:</strong> {entry.username}</p>
              <p><strong>Created:</strong> {new Date(entry.timestamp).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(entry.timestamp).toLocaleTimeString()}</p>
              <p><strong>Public:</strong> {entry.isPublic ? "Yes" : "No"}</p>
            </div>
            {token && isOwner && (
              <button onClick={handleDelete} className="delete-btn">
                Delete
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EntryDetail;