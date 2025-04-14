import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";
import SideNav from "./SideNav";
import "@fortawesome/fontawesome-free/css/all.min.css";

const EntryDetail = ({ token }) => {
  const [entry, setEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { id } = useParams();
  const history = useHistory();
  const [activePlant, setActivePlant] = useState(null);
  const [activeAnimal, setActiveAnimal] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [entryCommunity, setEntryCommunity] = useState("");

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/journal/${id}`, config);
        setEntry(res.data);

        if (token) {
          const accountRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/account`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUserId(accountRes.data._id);
          setIsOwner(accountRes.data._id === res.data.userId);

          // Fetch community details for the entry only
          const communityIds = res.data.communityId ? [res.data.communityId] : [];
          if (communityIds.length > 0) {
            const communityPromises = communityIds.map(id =>
              axios.get(`${process.env.REACT_APP_API_URL}/api/communities/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            );
            const communityResponses = await Promise.all(communityPromises);
            const communityMap = communityResponses.reduce((acc, { data }) => {
              acc[data._id] = data.name;
              return acc;
            }, {});
            if (res.data.communityId) {
              setEntryCommunity(communityMap[res.data.communityId] || "Unknown");
            }
          }
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
    history.push({
      pathname: "/journal",
      state: { entryToEdit: { ...entry, content: editableContent } }
    });
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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please log in to add a comment.");
      history.push("/login");
      return;
    }
    if (!commentContent.trim()) {
      alert("Comment cannot be empty.");
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/journal/${id}/comments`,
        { content: commentContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEntry({
        ...entry,
        comments: [...(entry.comments || []), res.data]
      });
      setCommentContent("");
    } catch (err) {
      console.error("Error adding comment:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        alert(err.response?.data?.error || "Failed to add comment.");
      }
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentContent(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentContent.trim()) {
      alert("Comment cannot be empty.");
      return;
    }

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/journal/${id}/comments/${commentId}`,
        { content: editingCommentContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEntry({
        ...entry,
        comments: entry.comments.map((c) =>
          c._id === commentId ? { ...c, ...res.data } : c
        ),
      });
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err) {
      console.error("Error updating comment:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        alert(err.response?.data?.error || "Failed to update comment.");
      }
    }
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
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
            {(entry.plantsObserved?.length > 0 || entry.animalsObserved?.length > 0) && (
              <div className="observations-tabs">
                <div className="observations-column">
                  <h3>Plants Observed</h3>
                  {entry.plantsObserved?.length > 0 ? (
                    entry.plantsObserved.map((plant, index) => (
                      <div
                        key={index}
                        className={`observation-item ${activePlant === index ? 'expanded' : ''}`}
                        onClick={() => setActivePlant(activePlant === index ? null : index)}
                      >
                        <div className="observation-item-content">
                          <img
                            src={
                              plant.photo?.startsWith('http')
                                ? plant.photo
                                : `${process.env.REACT_APP_API_URL}/${plant.photo}`
                            }
                            alt={plant.commonName}
                            className="observation-image"
                          />
                          <div className="observation-details">
                            <p><strong>Common Name:</strong> {plant.commonName}</p>
                            <p><strong>Scientific Name:</strong> {plant.scientificName}</p>
                          </div>
                        </div>
                        {activePlant === index && (
                          <div className="expanded-content">
                            {plant.notes ? (
                              <p className="expanded-notes"><strong>Notes:</strong> {plant.notes}</p>
                            ) : (
                              <p className="expanded-notes">No notes available.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No plants recorded.</p>
                  )}
                </div>
                <div className="observations-column">
                  <h3>Animals Observed</h3>
                  {entry.animalsObserved?.length > 0 ? (
                    entry.animalsObserved.map((animal, index) => (
                      <div
                        key={index}
                        className={`observation-item ${activeAnimal === index ? 'expanded' : ''}`}
                        onClick={() => setActiveAnimal(activeAnimal === index ? null : index)}
                      >
                        <div className="observation-item-content">
                          <img
                            src={
                              animal.photo?.startsWith('http')
                                ? animal.photo
                                : `${process.env.REACT_APP_API_URL}/${animal.photo}`
                            }
                            alt={animal.commonName}
                            className="observation-image"
                          />
                          <div className="observation-details">
                            <p><strong>Common Name:</strong> {animal.commonName}</p>
                            <p><strong>Scientific Name:</strong> {animal.scientificName}</p>
                          </div>
                        </div>
                        {activeAnimal === index && (
                          <div className="expanded-content">
                            {animal.notes ? (
                              <p className="expanded-notes"><strong>Notes:</strong> {animal.notes}</p>
                            ) : (
                              <p className="expanded-notes">No notes available.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No animals recorded.</p>
                  )}
                </div>
              </div>
            )}
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
              <p><strong>Community:</strong> {entryCommunity || "None"}</p>
              <p><strong>Public:</strong> {entry.isPublic ? "Yes" : "No"}</p>
            </div>
            {token && isOwner && (
              <button onClick={handleDelete} className="delete-btn">
                Delete
              </button>
            )}
            {entry.isPublic && (
              <div className="comments-section">
                <h3>Comments</h3>
                {entry.comments?.length > 0 ? (
                  <div className="comments-list">
                    {entry.comments.map((comment) => (
                      <div key={comment._id} className="comment-item">
                        <p>
                          <strong>{comment.username}</strong> (
                          {new Date(comment.createdAt).toLocaleDateString()}{" "}
                          {new Date(comment.createdAt).toLocaleTimeString()}
                          {comment.updatedAt && " (Edited)"}
                          )
                        </p>
                        {editingCommentId === comment._id ? (
                          <div className="edit-comment-form">
                            <textarea
                              value={editingCommentContent}
                              onChange={(e) => setEditingCommentContent(e.target.value)}
                              placeholder="Edit your comment..."
                            />
                            <div className="comment-actions">
                              <button
                                onClick={() => handleUpdateComment(comment._id)}
                                className="save-comment-btn"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditComment}
                                className="cancel-comment-btn"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p>{comment.content}</p>
                        )}
                        {token && comment.userId === currentUserId && (
                          <button
                            onClick={() => handleEditComment(comment)}
                            className="edit-comment-btn"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No comments yet.</p>
                )}
                {token && (
                  <form onSubmit={handleAddComment} className="add-comment-form">
                    <textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Add a comment..."
                      rows="4"
                    />
                    <button type="submit" className="submit-comment-btn">
                      Submit Comment
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EntryDetail;