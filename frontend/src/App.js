import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchWindow, setSearchWindow] = useState({
    visible: true,
    position: { x: 50, y: 50 }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedSidebarItem, setSelectedSidebarItem] = useState('search');
  const [searchForm, setSearchForm] = useState({
    vorname: '',
    name: '',
    strasse: '',
    plz: '',
    ort: '',
    vertragsnummer: '',
    kundennummer: '',
    geburtsdatum: '',
    kfz_kennzeichen: '',
    antragsnummer: '',
    schadenummer: '',
    gesellschaft: '',
    maxResults: '60'
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropZoneProcessing, setDropZoneProcessing] = useState(false);
  const [customerFormVisible, setCustomerFormVisible] = useState(false);
  const [documentsVisible, setDocumentsVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDocuments, setCustomerDocuments] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    tags: '',
    file: null
  });
  const [newCustomer, setNewCustomer] = useState({
    anrede: '',
    titel: '',
    vorname: '',
    name: '',
    kunde_id: '',
    strasse: '',
    plz: '',
    ort: '',
    telefon: { telefon_privat: '', email: '' },
    persoenliche_daten: { geburtsdatum: '' },
    bemerkung: ''
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle search form changes
  const handleSearchChange = (field, value) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle customer form changes
  const handleCustomerChange = (field, value) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setNewCustomer(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [childField]: value
        }
      }));
    } else {
      setNewCustomer(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Perform customer search
  const performSearch = async () => {
    setIsSearching(true);
    try {
      const searchParams = new URLSearchParams();
      Object.entries(searchForm).forEach(([key, value]) => {
        if (value && key !== 'maxResults') {
          if (key === 'kundennummer') {
            searchParams.append('kunde_id', value);
          } else {
            searchParams.append(key, value);
          }
        }
      });
      searchParams.append('limit', searchForm.maxResults);

      const response = await axios.get(`${API}/kunden/search?${searchParams.toString()}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Suchfehler:', error);
      alert('Fehler bei der Suche: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSearching(false);
    }
  };

  // Create new customer
  const createCustomer = async () => {
    try {
      const customerData = {
        ...newCustomer,
        persoenliche_daten: newCustomer.persoenliche_daten.geburtsdatum 
          ? { geburtsdatum: newCustomer.persoenliche_daten.geburtsdatum }
          : null
      };
      
      const response = await axios.post(`${API}/kunden`, customerData);
      alert('Kunde erfolgreich erstellt!');
      setCustomerFormVisible(false);
      setNewCustomer({
        anrede: '',
        titel: '',
        vorname: '',
        name: '',
        kunde_id: '',
        strasse: '',
        plz: '',
        ort: '',
        telefon: { telefon_privat: '', email: '' },
        persoenliche_daten: { geburtsdatum: '' },
        bemerkung: ''
      });
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Close search window
  const closeSearch = () => {
    setSearchWindow(prev => ({ ...prev, visible: false }));
  };

  // Handle sidebar clicks
  const handleSidebarClick = (item) => {
    setSelectedSidebarItem(item);
    if (item === 'search') {
      setSearchWindow(prev => ({ ...prev, visible: true }));
      setCustomerFormVisible(false);
    } else if (item === 'newcustomer') {
      setCustomerFormVisible(true);
      setSearchWindow(prev => ({ ...prev, visible: false }));
    }
  };

  // Drag functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.window-controls')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - searchWindow.position.x,
      y: e.clientY - searchWindow.position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setSearchWindow(prev => ({
      ...prev,
      position: {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      }
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle file drop
  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = (files) => {
    setDropZoneProcessing(true);
    setTimeout(() => {
      setDropZoneProcessing(false);
      alert(`${files.length} Datei(en) erfolgreich verarbeitet!`);
    }, 3000);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('de-DE', { hour12: false });
  };

  return (
    <div className="App">
      {/* Menu Bar */}
      <div className="menu-bar">
        <span className="menu-item">Datei</span>
        <span className="menu-item">Extras</span>
        <span className="menu-item">Selektionen</span>
        <span className="menu-item">Datenaustausch</span>
        <span className="menu-item">Aufgaben-Center</span>
        <span className="menu-item">Screenshot</span>
        <span className="user-info">Benutzer - PhilippWeimert</span>
      </div>
      
      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar */}
        <div className="sidebar">
          <button 
            className={`sidebar-item ${selectedSidebarItem === 'search' ? 'selected' : ''}`}
            onClick={() => handleSidebarClick('search')}
            data-testid="neue-suche-btn"
          >
            🔎 Neue Suche
          </button>
          <button 
            className={`sidebar-item ${selectedSidebarItem === 'newcustomer' ? 'selected' : ''}`}
            onClick={() => handleSidebarClick('newcustomer')}
            data-testid="kunde-neuerfassen-btn"
          >
            👤 Kunde Neuerfassen
          </button>
          <button 
            className={`sidebar-item ${selectedSidebarItem === 'vu' ? 'selected' : ''}`}
            onClick={() => handleSidebarClick('vu')}
            data-testid="vu-ges-btn"
          >
            🏢 VU / Ges.
          </button>
          
          {/* Drag & Drop Area */}
          <div className="drag-drop-sidebar">
            <div className="drag-drop-header">
              📧 E-Mail & PDF
            </div>
            <div 
              className="drop-zone-small" 
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              data-testid="drop-zone"
            >
              <div className="drop-icon-small">📁</div>
              <div className="drop-text-small">
                <strong>Dateien<br/>hinziehen</strong>
              </div>
              <div className="drop-formats-small">.pdf .eml .msg</div>
            </div>
            {dropZoneProcessing && (
              <div className="processing-status-small">
                <div className="status-text-small">Verarbeitung...</div>
                <div className="progress-bar-small">
                  <div className="progress-fill-small"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="content-area">
          {/* Customer Creation Form */}
          {customerFormVisible && (
            <div 
              className="search-window"
              style={{ 
                left: `${searchWindow.position.x}px`, 
                top: `${searchWindow.position.y}px`,
                width: '700px'
              }}
            >
              <div className="window-title" onMouseDown={handleMouseDown}>
                Neuen Kunden erfassen
                <div className="window-controls">
                  <div className="window-control">_</div>
                  <div className="window-control">□</div>
                  <div className="window-control" onClick={() => setCustomerFormVisible(false)}>✕</div>
                </div>
              </div>
              
              <div className="form-content customer-form">
                <div className="form-group">
                  <label>Anrede</label>
                  <select 
                    value={newCustomer.anrede}
                    onChange={(e) => handleCustomerChange('anrede', e.target.value)}
                    data-testid="anrede-select"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Firma">Firma</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Titel</label>
                  <input 
                    type="text" 
                    value={newCustomer.titel}
                    onChange={(e) => handleCustomerChange('titel', e.target.value)}
                    data-testid="titel-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Vorname</label>
                  <input 
                    type="text" 
                    value={newCustomer.vorname}
                    onChange={(e) => handleCustomerChange('vorname', e.target.value)}
                    data-testid="vorname-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={newCustomer.name}
                    onChange={(e) => handleCustomerChange('name', e.target.value)}
                    data-testid="name-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Kunden-ID</label>
                  <input 
                    type="text" 
                    value={newCustomer.kunde_id}
                    onChange={(e) => handleCustomerChange('kunde_id', e.target.value)}
                    data-testid="kunde-id-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Straße</label>
                  <input 
                    type="text" 
                    value={newCustomer.strasse}
                    onChange={(e) => handleCustomerChange('strasse', e.target.value)}
                    data-testid="strasse-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>PLZ</label>
                  <input 
                    type="text" 
                    value={newCustomer.plz}
                    onChange={(e) => handleCustomerChange('plz', e.target.value)}
                    data-testid="plz-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Ort</label>
                  <input 
                    type="text" 
                    value={newCustomer.ort}
                    onChange={(e) => handleCustomerChange('ort', e.target.value)}
                    data-testid="ort-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Telefon privat</label>
                  <input 
                    type="text" 
                    value={newCustomer.telefon.telefon_privat}
                    onChange={(e) => handleCustomerChange('telefon.telefon_privat', e.target.value)}
                    data-testid="telefon-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>E-Mail</label>
                  <input 
                    type="email" 
                    value={newCustomer.telefon.email}
                    onChange={(e) => handleCustomerChange('telefon.email', e.target.value)}
                    data-testid="email-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Geburtsdatum</label>
                  <input 
                    type="date" 
                    value={newCustomer.persoenliche_daten.geburtsdatum}
                    onChange={(e) => handleCustomerChange('persoenliche_daten.geburtsdatum', e.target.value)}
                    data-testid="geburtsdatum-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Bemerkung</label>
                  <textarea 
                    value={newCustomer.bemerkung}
                    onChange={(e) => handleCustomerChange('bemerkung', e.target.value)}
                    data-testid="bemerkung-textarea"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="form-bottom">
                <div className="form-buttons">
                  <button className="btn" onClick={createCustomer} data-testid="create-customer-btn">
                    Erstellen
                  </button>
                  <button className="btn" onClick={() => setCustomerFormVisible(false)} data-testid="cancel-customer-btn">
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Window */}
          {searchWindow.visible && !customerFormVisible && (
            <div 
              className="search-window"
              style={{ 
                left: `${searchWindow.position.x}px`, 
                top: `${searchWindow.position.y}px` 
              }}
            >
              <div className="window-title" onMouseDown={handleMouseDown}>
                Kunde(n) suchen
                <div className="window-controls">
                  <div className="window-control">_</div>
                  <div className="window-control">□</div>
                  <div className="window-control" onClick={closeSearch}>✕</div>
                </div>
              </div>
              
              <div className="form-content">
                <div className="form-group">
                  <label>Vorname</label>
                  <input 
                    type="text" 
                    value={searchForm.vorname}
                    onChange={(e) => handleSearchChange('vorname', e.target.value)}
                    data-testid="search-vorname-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={searchForm.name}
                    onChange={(e) => handleSearchChange('name', e.target.value)}
                    data-testid="search-name-input"
                  />
                </div>
                
                <div className="form-row-address">
                  <div className="form-group">
                    <label>Straße</label>
                    <input 
                      type="text" 
                      value={searchForm.strasse}
                      onChange={(e) => handleSearchChange('strasse', e.target.value)}
                      data-testid="search-strasse-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>PLZ</label>
                    <input 
                      type="text" 
                      value={searchForm.plz}
                      onChange={(e) => handleSearchChange('plz', e.target.value)}
                      data-testid="search-plz-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ort</label>
                    <input 
                      type="text" 
                      value={searchForm.ort}
                      onChange={(e) => handleSearchChange('ort', e.target.value)}
                      data-testid="search-ort-input"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Vertragsnummer</label>
                  <input 
                    type="text" 
                    value={searchForm.vertragsnummer}
                    onChange={(e) => handleSearchChange('vertragsnummer', e.target.value)}
                    data-testid="search-vertragsnummer-input"
                  />
                </div>
                
                <div className="form-group customer-birth">
                  <div>
                    <label>Kunden-Nummer</label>
                    <input 
                      type="text" 
                      value={searchForm.kundennummer}
                      onChange={(e) => handleSearchChange('kundennummer', e.target.value)}
                      placeholder="- -"
                      data-testid="search-kundennummer-input"
                    />
                  </div>
                  <div>
                    <label>Geburtsdatum</label>
                    <input 
                      type="date" 
                      value={searchForm.geburtsdatum}
                      onChange={(e) => handleSearchChange('geburtsdatum', e.target.value)}
                      data-testid="search-geburtsdatum-input"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>KFZ-Kennzeichen</label>
                  <input 
                    type="text" 
                    value={searchForm.kfz_kennzeichen}
                    onChange={(e) => handleSearchChange('kfz_kennzeichen', e.target.value)}
                    data-testid="search-kfz-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Antragsnummer</label>
                  <input 
                    type="text" 
                    value={searchForm.antragsnummer}
                    onChange={(e) => handleSearchChange('antragsnummer', e.target.value)}
                    data-testid="search-antragsnummer-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Schadenummer</label>
                  <input 
                    type="text" 
                    value={searchForm.schadenummer}
                    onChange={(e) => handleSearchChange('schadenummer', e.target.value)}
                    data-testid="search-schadenummer-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Gesellschaft</label>
                  <input 
                    type="text" 
                    value={searchForm.gesellschaft}
                    onChange={(e) => handleSearchChange('gesellschaft', e.target.value)}
                    placeholder="..."
                    data-testid="search-gesellschaft-input"
                  />
                </div>
              </div>
              
              <div className="form-bottom">
                <div className="max-results">
                  maximal 
                  <input 
                    type="text" 
                    value={searchForm.maxResults}
                    onChange={(e) => handleSearchChange('maxResults', e.target.value)}
                    data-testid="max-results-input"
                  /> 
                  Datensätze abrufen
                </div>
                
                <div className="form-buttons">
                  <button 
                    className="btn" 
                    onClick={performSearch}
                    disabled={isSearching}
                    data-testid="search-ok-btn"
                  >
                    {isSearching ? 'Suche...' : 'OK'}
                  </button>
                  <button className="btn" onClick={closeSearch} data-testid="search-cancel-btn">
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div 
              className="search-results-window"
              style={{ 
                left: `${searchWindow.position.x + 620}px`, 
                top: `${searchWindow.position.y}px` 
              }}
              data-testid="search-results"
            >
              <div className="window-title">
                Suchergebnisse ({searchResults.length})
              </div>
              <div className="results-content">
                {searchResults.map((kunde) => (
                  <div key={kunde.id} className="result-item" data-testid={`result-item-${kunde.id}`}>
                    <div className="result-name">
                      {kunde.anrede} {kunde.titel} {kunde.vorname} {kunde.name}
                    </div>
                    <div className="result-address">
                      {kunde.strasse}, {kunde.plz} {kunde.ort}
                    </div>
                    <div className="result-id">ID: {kunde.kunde_id || kunde.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-section">V.001</div>
        <div className="status-buttons">
          <button className="status-btn" data-testid="import-btn">Import</button>
          <button className="status-btn" data-testid="export-btn">Export</button>
        </div>
        <div className="status-section" data-testid="time-display">
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  );
};

export default App;