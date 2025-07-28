import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, User, LogOut, ArrowLeft, Save, X } from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://note-taking-application-seven.vercel.app/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setNotes(data.notes);
      } else {
        console.error('Failed notes:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      setErrors({ create: 'Both title and content are required' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://note-taking-application-seven.vercel.app/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      });

      const data = await response.json();
      if (response.ok) {
        setNotes([data.note, ...notes]);
        setNewNote({ title: '', content: '' });
        setShowCreateModal(false);
        setErrors({});
      } else {
        setErrors({ create: data.error || 'Failed' });
      }
    } catch (error) {
      setErrors({ create: 'Network error. Please try again.' + error });
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote.title.trim() || !editingNote.content.trim()) {
      setErrors({ edit: 'Both title and content are required' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://note-taking-application-seven.vercel.app/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingNote.title,
          content: editingNote.content,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setNotes(notes.map(note => 
          note.id === editingNote.id ? data.note : note
        ));
        setEditingNote(null);
        setErrors({});
      } else {
        setErrors({ edit: data.error || 'Failed' });
      }
    } catch (error) {
      setErrors({ edit: 'Network error. Please try again.' + error });
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://note-taking-application-seven.vercel.app/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed');
      }
    } catch (error) {
      alert('Network error. Please try again.'+error);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate('/welcome')}
          >
            <ArrowLeft size={20} />
          </button>
          <h1>My Notes</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <User size={20} />
            <span>{user?.name}</span>
          </div>
          <button className="logout-button" onClick={onLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-controls">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="create-button"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            New Note
          </button>
        </div>

        <div className="notes-grid">
          {filteredNotes.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '64px' }}>📝</div>
              <h3>No notes yet</h3>
              <p>Create your first note to get started!</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <h3>{note.title}</h3>
                  <div className="note-actions">
                    <button
                      className="action-button edit"
                      onClick={() => setEditingNote(note)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="note-content">
                  <p>{note.content}</p>
                </div>
                <div className="note-footer">
                  <span className="note-date">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Note</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewNote({ title: '', content: '' });
                  setErrors({});
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              {errors.create && (
                <div className="error-message">
                  {errors.create}
                </div>
              )}
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Enter note title"
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note here..."
                  rows="6"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="button secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewNote({ title: '', content: '' });
                  setErrors({});
                }}
              >
                Cancel
              </button>
              <button
                className="button primary"
                onClick={handleCreateNote}
              >
                <Save size={16} />
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}

      {editingNote && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Note</h2>
              <button
                className="close-button"
                onClick={() => {
                  setEditingNote(null);
                  setErrors({});
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              {errors.edit && (
                <div className="error-message">
                  {errors.edit}
                </div>
              )}
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="Enter note title"
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  placeholder="Write your note here..."
                  rows="6"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="button secondary"
                onClick={() => {
                  setEditingNote(null);
                  setErrors({});
                }}
              >
                Cancel
              </button>
              <button
                className="button primary"
                onClick={handleUpdateNote}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
