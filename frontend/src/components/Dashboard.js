import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Chat from './Chat';

function Dashboard() {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState('listing');

  const handleBuildListing = () => {
    history.push('/listing-builder');
  };

  return (
    <div className="property-app">
      <header className="app-header">
        <div className="logo">
          Avail
        </div>
      </header>

      <main className="content-area">
        <div className="listing-content">
          <div className="listing-header">
            <h1>Market Listing</h1>
            <button className="build-listing-btn" onClick={handleBuildListing}>BUILD LISTING</button>
          </div>
          <div className="listing-share">
            <span className="listing-url">https://www.avail.co/l/61306459</span>
            <div className="share-buttons">
            </div>
          </div>
          <div className="promoted-listings">
            <div className="promo-header">
              <h3>Introducing Promoted Listings</h3>
              <span className="new-badge">New</span>
            </div>
            <p>Once you publish, boost your listings exposure to rent your place faster.</p>
            <div className="promo-footer">
              <a href="#learn-more" className="learn-more">Learn How It Works <span className="arrow">→</span></a>

              <nav className="bottom-nav">
                <ul className="nav-tabs">
                  <li className={activeTab === 'listing' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('listing')}>
                      <i className="icon-listing"></i> Listing
                    </button>
                  </li>
                  <li className={activeTab === 'applications' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('applications')}>
                      <i className="icon-applications"></i> Applications
                    </button>
                  </li>
                  <li className={activeTab === 'leases' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('leases')}>
                      <i className="icon-leases"></i> Leases
                    </button>
                  </li>
                  <li className={activeTab === 'payments' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('payments')}>
                      <i className="icon-payments"></i> Payments
                    </button>
                  </li>
                  <li className={activeTab === 'maintenance' ? 'active' : ''}>
                    <button onClick={() => setActiveTab('maintenance')}>
                      <i className="icon-maintenance"></i> Maintenance
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        {activeTab === 'applications' && (
          <div className="tab-content">
            <h2>Applications Content</h2>
            <p>Manage your rental applications here.</p>
          </div>
        )}

        {activeTab === 'leases' && (
          <div className="tab-content">
            <h2>Leases Content</h2>
            <p>Manage your rental leases here.</p>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="tab-content">
            <h2>Payments Content</h2>
            <p>Manage your rental payments here.</p>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="tab-content">
            <h2>Maintenance Content</h2>
            <p>Manage maintenance requests and repairs here.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Avail. All rights reserved.</p>
      </footer>

      <Chat />
    </div>
  );
}

export default Dashboard;