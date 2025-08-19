import React, { useState, useEffect } from 'react';
import './GroupCreation.css';

interface GroupCreationProps {
  onClose: () => void;
  onCreateGroup: (groupName: string, members: string[]) => void;
  currentUser: string;
}

const GroupCreation: React.FC<GroupCreationProps> = ({ onClose, onCreateGroup, currentUser }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Array<{username: string, name: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch('/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: 'get_contacts',
          username: currentUser
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableContacts(data.map((contact: any) => ({
          username: contact.contact_id,
          name: contact.contact_name
        })));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleMemberToggle = (username: string) => {
    setSelectedMembers(prev =>
      prev.includes(username)
        ? prev.filter(m => m !== username)
        : [...prev, username]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setLoading(true);
    try {
      await onCreateGroup(groupName.trim(), selectedMembers);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="group-creation-overlay" onClick={onClose}>
      <div className="group-creation-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>Select Members</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts..."
              className="search-input"
            />

            <div className="contacts-list">
              {filteredContacts.map(contact => (
                <div
                  key={contact.username}
                  className={`contact-item ${selectedMembers.includes(contact.username) ? 'selected' : ''}`}
                  onClick={() => handleMemberToggle(contact.username)}
                >
                  <div className="contact-avatar">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-username">@{contact.username}</span>
                  </div>
                  <div className="selection-indicator">
                    {selectedMembers.includes(contact.username) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="selected-summary">
            <span>{selectedMembers.length} member(s) selected</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCreation;
