import React, { useState, useEffect } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import SideNav from "./SideNav";

const Account = ({ token }) => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
  });
  const [editData, setEditData] = useState(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [categories, setCategories] = useState({
    Plants: false,
    Wildlife: false,
    Weather: false,
    "Scenic Views": false,
  });
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const history = useHistory();

  useEffect(() => {
    if (!token) {
      history.push("/login");
      return;
    }

    fetchUserData();
    fetchEntries();
  }, [token, history]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/account", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserData({
        firstName: response.data.firstName || "",
        lastName: response.data.lastName || "",
        email: response.data.email || "",
        username: response.data.username || "",
      });

      setCategories(
        response.data.preferences?.categories || {
          Plants: false,
          Wildlife: false,
          Weather: false,
          "Scenic Views": false,
        }
      );
      setFavoriteLocations(response.data.preferences?.favoriteLocations || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching user data:", error.response?.data || error.message);
      setError(error.response?.data?.error || "Failed to fetch user data");
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/journal", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching journal entries:", error.response?.data || error.message);
      setError("Failed to fetch journal entries");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    history.push("/login");
  };

  const handleEdit = () => {
    setEditData({ ...userData });
  };

  const handleSave = async () => {
    try {
      const response = await axios.put("http://localhost:5000/api/account", editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData({
        firstName: response.data.firstName || "",
        lastName: response.data.lastName || "",
        email: response.data.email || "",
        username: response.data.username || "",
      });
      setEditData(null);
      setError(null);
      alert("Account information updated successfully");
    } catch (error) {
      console.error("Error updating account:", error.response?.data || error.message);
      setError(error.response?.data?.error || "Failed to update account information");
    }
  };

  const handleCancel = () => {
    setEditData(null);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setError("Please enter both old and new passwords");
      return;
    }

    try {
      await axios.put(
        "http://localhost:5000/api/account/password",
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOldPassword("");
      setNewPassword("");
      setIsEditingPassword(false);
      setError(null);
      alert("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error.response?.data || error.message);
      setError(error.response?.data?.error || "Failed to update password");
    }
  };

  const handleEditPasswordClick = () => {
    setIsEditingPassword(true);
  };

  const handleCancelPasswordEdit = () => {
    setIsEditingPassword(false);
    setOldPassword("");
    setNewPassword("");
    setError(null);
  };

  const handleCategoryChange = async (category) => {
    const updatedCategories = { ...categories, [category]: !categories[category] };
    setCategories(updatedCategories);
    await savePreferences({ categories: updatedCategories, favoriteLocations });
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      try {
        await axios.delete("http://localhost:5000/api/account", {
          headers: { Authorization: `Bearer ${token}` },
        });
        handleLogout();
      } catch (error) {
        console.error("Error deleting account:", error.response?.data || error.message);
        setError(error.response?.data?.error || "Failed to delete account");
      }
    }
  };

  const savePreferences = async (preferences) => {
    try {
      await axios.put("http://localhost:5000/api/account/preferences", preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setError(null);
    } catch (error) {
      console.error("Error saving preferences:", error.response?.data || error.message);
      setError(error.response?.data?.error || "Failed to save preferences");
    }
  };

  const handleCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  if (!token) return null;

  return (
    <div className="app-container">
      <SideNav
        token={token}
        entries={entries}
        handleLogout={handleLogout}
        handleCardClick={handleCardClick}
      />
      <div className="main-content">
        <div className="account-container">
          <h2>Account Settings</h2>
          {error && <p className="error">{error}</p>}
          <section className="account-info">
            <h3>Account Information</h3>
            {editData ? (
              <div className="form-grid">
                <div>
                  <label>First Name:</label>
                  <input
                    value={editData.firstName}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label>Last Name:</label>
                  <input
                    value={editData.lastName}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label>Username:</label>
                  <input
                    value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label>Email Address:</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <div className="button-group">
                  <button onClick={handleSave}>Save</button>
                  <button onClick={handleCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div>
                  <label>First Name:</label>
                  <input value={userData.firstName} readOnly />
                </div>
                <div>
                  <label>Last Name:</label>
                  <input value={userData.lastName} readOnly />
                </div>
                <div>
                  <label>Username:</label>
                  <input value={userData.username} readOnly />
                </div>
                <div>
                  <label>Email Address:</label>
                  <input value={userData.email} readOnly />
                </div>
                <div className="button-group">
                  <button onClick={handleEdit}>Edit</button>
                </div>
              </div>
            )}
          </section>

          <section className="password-change">
            <h3>Change Password</h3>
            {!isEditingPassword ? (
              <div className="form-grid">
                <div>
                  <label>Current Password:</label>
                  <input value="••••••••" readOnly />
                </div>
                <div className="button-group">
                  <button onClick={handleEditPasswordClick}>Update Password</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword}>
                <div className="form-grid password-grid">
                  <div className="password-column">
                    <label>Old Password:</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Old Password"
                      required
                    />
                  </div>
                  <div className="password-column">
                    <label>New Password:</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      required
                    />
                  </div>
                  <div className="button-group full-width">
                    <button type="submit">Save</button>
                    <button type="button" onClick={handleCancelPasswordEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>

          <section className="preferences">
            <h3>Journal Preferences</h3>
            <div className="form-grid">
              <div>
                <input
                  type="checkbox"
                  checked={categories["Plants"]}
                  onChange={() => handleCategoryChange("Plants")}
                />
                <label>Plants</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  checked={categories["Weather"]}
                  onChange={() => handleCategoryChange("Weather")}
                />
                <label>Weather</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  checked={categories["Wildlife"]}
                  onChange={() => handleCategoryChange("Wildlife")}
                />
                <label>Wildlife</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  checked={categories["Scenic Views"]}
                  onChange={() => handleCategoryChange("Scenic Views")}
                />
                <label>Scenic Views</label>
              </div>
            </div>
          </section>

          <section className="favorite-locations">
            <h3>Favorite Locations</h3>
            <div className="map-placeholder">
              {favoriteLocations.length > 0 ? (
                favoriteLocations.map((loc, index) => (
                  <div key={index}>
                    {loc.location} ({loc.lat}, {loc.lng})
                  </div>
                ))
              ) : (
                <p>No favorite locations saved yet</p>
              )}
            </div>
          </section>

          <section className="danger-zone">
            <h3>Danger Zone</h3>
            <button onClick={handleDeleteAccount} className="delete-account-btn">
              Delete Account
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Account;