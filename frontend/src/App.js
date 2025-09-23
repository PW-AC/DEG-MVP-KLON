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
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [customerContracts, setCustomerContracts] = useState({});
  const [tabDocumentsView, setTabDocumentsView] = useState({}); // Track which tabs show documents
  const [allCustomers, setAllCustomers] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
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

  // Load customer documents
  const loadCustomerDocuments = async (kundeId) => {
    try {
      const response = await axios.get(`${API}/kunden/${kundeId}/documents`);
      setCustomerDocuments(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Dokumente:', error);
      setCustomerDocuments([]);
    }
  };

  // Upload document
  const uploadDocument = async (kundeId) => {
    if (!uploadForm.file) {
      alert('Bitte wählen Sie eine Datei aus.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = btoa(e.target.result);
        
        const formData = new FormData();
        formData.append('kunde_id', kundeId);
        formData.append('title', uploadForm.title || uploadForm.file.name);
        formData.append('description', uploadForm.description);
        formData.append('tags', uploadForm.tags);
        formData.append('file_content', base64Content);

        const response = await axios.post(`${API}/documents/upload`, formData);
        alert('Dokument erfolgreich hochgeladen!');
        
        // Reset form
        setUploadForm({ title: '', description: '', tags: '', file: null });
        
        // Reload documents
        await loadCustomerDocuments(kundeId);
      };
      reader.readAsBinaryString(uploadForm.file);
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      alert('Fehler beim Hochladen: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Handle document result click - now opens documents in tab
  const handleDocumentResultClick = (kunde) => {
    // Find the tab for this customer
    const existingTab = openTabs.find(tab => tab.kunde && tab.kunde.id === kunde.id);
    if (existingTab) {
      // Switch to documents view in this tab
      setTabDocumentsView(prev => ({
        ...prev,
        [existingTab.id]: true
      }));
      setActiveTab(existingTab.id);
      loadCustomerDocuments(kunde.id);
    }
  };

  // Handle documents button in customer header
  const openDocumentsInTab = (tabId, kundeId) => {
    setTabDocumentsView(prev => ({
      ...prev,
      [tabId]: true
    }));
    loadCustomerDocuments(kundeId);
  };

  // Close documents view in tab
  const closeDocumentsInTab = (tabId) => {
    setTabDocumentsView(prev => ({
      ...prev,
      [tabId]: false
    }));
  };

  // Open customer in new tab
  const openCustomerTab = (kunde) => {
    // Check if tab is already open
    const existingTab = openTabs.find(tab => tab.kunde && tab.kunde.id === kunde.id);
    if (existingTab) {
      setActiveTab(existingTab.id);
      return;
    }

    // Create new tab
    const newTab = {
      id: `tab-${kunde.id}`,
      kunde: kunde,
      title: `${kunde.vorname || ''} ${kunde.name || ''}`.trim(),
      type: 'customer'
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    
    // Load customer contracts
    loadCustomerContracts(kunde.id);
  };

  // Check for duplicate customers based on name and personal data
  const checkForDuplicates = (customers) => {
    const duplicates = [];
    
    for (let i = 0; i < customers.length; i++) {
      for (let j = i + 1; j < customers.length; j++) {
        const customer1 = customers[i];
        const customer2 = customers[j];
        
        // Check if customers are potential duplicates
        const nameMatch = customer1.name && customer2.name && 
                         customer1.name.toLowerCase() === customer2.name.toLowerCase();
        
        const vornameMatch = customer1.vorname && customer2.vorname && 
                            customer1.vorname.toLowerCase() === customer2.vorname.toLowerCase();
        
        const addressMatch = customer1.strasse && customer2.strasse && customer1.plz && customer2.plz &&
                             customer1.strasse.toLowerCase() === customer2.strasse.toLowerCase() &&
                             customer1.plz === customer2.plz;
        
        // Consider as duplicate if name + vorname match, or name + address match
        if ((nameMatch && vornameMatch) || (nameMatch && addressMatch)) {
          const existingDuplicate = duplicates.find(dup => 
            dup.includes(customer1.kunde_id) || dup.includes(customer2.kunde_id)
          );
          
          if (!existingDuplicate) {
            duplicates.push([customer1.kunde_id, customer2.kunde_id]);
          }
        }
      }
    }
    
    return duplicates;
  };

  // Intelligent search - show overview for multiple results, direct customer for single result
  const performIntelligentSearch = async () => {
    setIsSearching(true);
    try {
      // Use the same search logic as before
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
      const results = response.data;
      
      if (results.length === 0) {
        alert('Keine Kunden gefunden.');
        return;
      }
      
      if (results.length === 1) {
        // Single customer found - open direct customer view
        alert('Kunde gefunden - öffne Gesamtübersicht');
        const customer = results[0];
        openCustomerTab(customer);
        setSearchWindow(prev => ({ ...prev, visible: false }));
        
        // Clear search form
        setSearchForm({
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
        
      } else {
        // Multiple customers found - open customer overview
        alert(`Mehrere Datensätze gefunden (${results.length}) - öffne Kundenübersicht`);
        setAllCustomers(results);
        
        // Create/update "All Customers" tab
        const allCustomersTab = {
          id: 'tab-all-customers',
          title: `Alle Kunden (${results.length})`,
          type: 'all-customers'
        };

        const existingTabIndex = openTabs.findIndex(tab => tab.id === 'tab-all-customers');
        if (existingTabIndex !== -1) {
          setOpenTabs(prev => {
            const newTabs = [...prev];
            newTabs[existingTabIndex] = allCustomersTab;
            return newTabs;
          });
        } else {
          setOpenTabs(prev => [...prev, allCustomersTab]);
        }
        
        setActiveTab('tab-all-customers');
        setSearchWindow(prev => ({ ...prev, visible: false }));
        
        // Clear search form
        setSearchForm({
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
      }
      
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      alert('Fehler bei der Suche: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSearching(false);
    }
  };

  // Load customer contracts
  const loadCustomerContracts = async (kundeId) => {
    try {
      const response = await axios.get(`${API}/vertraege/kunde/${kundeId}`);
      setCustomerContracts(prev => ({
        ...prev,
        [kundeId]: response.data
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Verträge:', error);
      setCustomerContracts(prev => ({
        ...prev,
        [kundeId]: []
      }));
    }
  };

  // Close tab
  const closeTab = (tabId) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      const remainingTabs = openTabs.filter(tab => tab.id !== tabId);
      setActiveTab(remainingTabs.length > 0 ? remainingTabs[0].id : null);
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
      setDocumentsVisible(false);
    } else if (item === 'newcustomer') {
      setCustomerFormVisible(true);
      setSearchWindow(prev => ({ ...prev, visible: false }));
      setDocumentsVisible(false);
    } else if (item === 'vu') {
      setSearchWindow(prev => ({ ...prev, visible: false }));
      setCustomerFormVisible(false);
      setDocumentsVisible(false);
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
      setUploadForm(prev => ({
        ...prev,
        file: files[0],
        title: prev.title || files[0].name.split('.')[0] // Set title to filename if empty
      }));
    }
  };

  // Handle click on drop zone
  const handleDropZoneClick = () => {
    document.getElementById('file-upload').click();
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
          {/* Tab Bar */}
          {openTabs.length > 0 && (
            <div className="tab-bar">
              {openTabs.map(tab => (
                <div 
                  key={tab.id} 
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                >
                  <span className="tab-title">{tab.title}</span>
                  <span 
                    className="tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    data-testid={`close-tab-${tab.id}`}
                  >
                    ✕
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content */}
          {activeTab && openTabs.find(tab => tab.id === activeTab) && (
            <div className="tab-content">
              {(() => {
                const currentTab = openTabs.find(tab => tab.id === activeTab);
                
                if (!currentTab) return null;
                
                if (currentTab.type === 'all-customers') {
                  return (
                    <div className="all-customers-tab-content" data-testid="all-customers-tab-content">
                      <div className="all-customers-header">
                        <h3>📋 Alle Kunden ({allCustomers.length})</h3>
                      </div>
                      
                      <div className="all-customers-table">
                        <div className="all-customers-table-header">
                          <div className="all-customers-header-row">
                            <div className="all-customers-header-cell">Name</div>
                            <div className="all-customers-header-cell">Vorname</div>
                            <div className="all-customers-header-cell">Straße</div>
                            <div className="all-customers-header-cell">PLZ</div>
                            <div className="all-customers-header-cell">Ort</div>
                            <div className="all-customers-header-cell">K-ID</div>
                          </div>
                        </div>
                        
                        <div className="all-customers-table-body">
                          {allCustomers.length === 0 ? (
                            <div className="no-customers-message">
                              Keine Kunden gefunden.
                            </div>
                          ) : (
                            allCustomers.map((kunde) => (
                              <div 
                                key={kunde.id} 
                                className="all-customers-row" 
                                data-testid={`all-customers-row-${kunde.id}`}
                                onClick={() => openCustomerTab(kunde)}
                              >
                                <div className="all-customers-cell">{kunde.name || '-'}</div>
                                <div className="all-customers-cell">{kunde.vorname || '-'}</div>
                                <div className="all-customers-cell">{kunde.strasse || '-'}</div>
                                <div className="all-customers-cell">{kunde.plz || '-'}</div>
                                <div className="all-customers-cell">{kunde.ort || '-'}</div>
                                <div className="all-customers-cell">{kunde.kunde_id || '-'}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                if (currentTab.type === 'customer') {
                  const kunde = currentTab.kunde;
                  const contracts = customerContracts[kunde.id] || [];
                  
                  return (
                    <div className="customer-tab-content" data-testid={`customer-tab-content-${kunde.id}`}>
                      {/* Customer Header Info */}
                      <div className="customer-header">
                        <div className="customer-info-section">
                          <div className="customer-name-row">
                            <div className="info-item-large">
                              <label>Name:</label>
                              <span>{kunde.anrede} {kunde.titel} {kunde.vorname} {kunde.name}</span>
                            </div>
                            <div className="info-item">
                              <label>Tel:</label>
                              <span>{kunde.telefon?.telefon_privat || '-'}</span>
                            </div>
                          </div>
                          <div className="customer-address-row">
                            <div className="info-item-address">
                              <label>Adresse:</label>
                              <span>{kunde.strasse}, {kunde.plz} {kunde.ort}</span>
                            </div>
                          </div>
                        </div>
                        <div className="customer-actions">
                          <button 
                            className="customer-action-btn documents-btn"
                            onClick={() => openDocumentsInTab(currentTab.id, kunde.id)}
                            data-testid={`customer-documents-btn-${kunde.id}`}
                          >
                            📄 Dokumente
                          </button>
                          <button 
                            className="customer-action-btn edit-btn"
                            data-testid={`customer-edit-btn-${kunde.id}`}
                          >
                            ✏️ Bearbeiten
                          </button>
                        </div>
                      </div>

                      {/* Documents View or Contracts View */}
                      {tabDocumentsView[currentTab.id] ? (
                        <div className="documents-management-view">
                          <div className="documents-header">
                            <h3>📄 Dokumentenverwaltung - {kunde.vorname} {kunde.name}</h3>
                            <button 
                              className="close-documents-btn"
                              onClick={() => closeDocumentsInTab(currentTab.id)}
                              data-testid={`close-documents-view-${currentTab.id}`}
                            >
                              ← Zurück zu Verträgen
                            </button>
                          </div>
                          
                          <div className="documents-main-content">
                            {/* Left Side - Document List */}
                            <div className="documents-list-panel">
                              <div className="documents-list-header">
                                <h4>Vorhandene Dokumente ({customerDocuments.length})</h4>
                              </div>
                              
                              <div className="documents-tree">
                                {customerDocuments.length === 0 ? (
                                  <div className="empty-documents">
                                    <div className="folder-icon">📁</div>
                                    <div className="empty-text">Keine Dokumente vorhanden</div>
                                  </div>
                                ) : (
                                  <div className="documents-table">
                                    {/* Table Header */}
                                    <div className="documents-table-header">
                                      <div className="doc-header-cell doc-name-col">Name</div>
                                      <div className="doc-header-cell doc-date-col">Eingepflegt am</div>
                                    </div>
                                    
                                    {/* Table Body */}
                                    <div className="documents-table-body">
                                      {customerDocuments.map((doc) => (
                                        <div key={doc.id} className="document-row" data-testid={`doc-item-${doc.id}`}>
                                          <div className="doc-cell doc-name-cell">
                                            <div className="document-icon">
                                              {doc.document_type === 'pdf' && '📄'}
                                              {doc.document_type === 'email' && '✉️'}
                                              {doc.document_type === 'word' && '📝'}
                                              {doc.document_type === 'excel' && '📊'}
                                              {doc.document_type === 'image' && '🖼️'}
                                              {doc.document_type === 'other' && '📁'}
                                            </div>
                                            <span className="document-filename">{doc.filename}</span>
                                          </div>
                                          <div className="doc-cell doc-date-cell">
                                            {new Date(doc.created_at).toLocaleDateString('de-DE')}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Side - Upload Panel */}
                            <div className="upload-panel">
                              <div className="upload-header">
                                <h4>Neues Dokument hinzufügen</h4>
                              </div>
                              
                              <div className="upload-form-panel">
                                <div className="upload-fields">
                                  <div className="upload-field">
                                    <label>Typ:</label>
                                    <select 
                                      value={uploadForm.documentType || 'pdf'}
                                      onChange={(e) => setUploadForm(prev => ({...prev, documentType: e.target.value}))}
                                      data-testid="document-type-select"
                                    >
                                      <option value="pdf">PDF</option>
                                      <option value="email">E-Mail</option>
                                      <option value="word">Word</option>
                                      <option value="excel">Excel</option>
                                      <option value="image">Bild</option>
                                      <option value="other">Sonstiges</option>
                                    </select>
                                  </div>
                                  
                                  <div className="upload-field">
                                    <label>Titel:</label>
                                    <input 
                                      type="text" 
                                      value={uploadForm.title}
                                      onChange={(e) => setUploadForm(prev => ({...prev, title: e.target.value}))}
                                      placeholder="Dokumententitel"
                                      data-testid="upload-title-input"
                                    />
                                  </div>
                                  
                                  <div className="upload-field">
                                    <label>Kategorie:</label>
                                    <input 
                                      type="text" 
                                      value={uploadForm.category || ''}
                                      onChange={(e) => setUploadForm(prev => ({...prev, category: e.target.value}))}
                                      placeholder="z.B. Vertrag, Schaden"
                                      data-testid="upload-category-input"
                                    />
                                  </div>
                                  
                                  <div className="upload-field">
                                    <label>Tags:</label>
                                    <input 
                                      type="text" 
                                      value={uploadForm.tags}
                                      onChange={(e) => setUploadForm(prev => ({...prev, tags: e.target.value}))}
                                      placeholder="wichtig, vertrag, 2024"
                                      data-testid="upload-tags-input"
                                    />
                                  </div>
                                </div>
                                
                                <div className="drag-drop-area">
                                  <div 
                                    className="drop-zone-large" 
                                    onDrop={handleFileDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={(e) => e.preventDefault()}
                                    onClick={handleDropZoneClick}
                                    data-testid="upload-drop-zone"
                                  >
                                    <div className="drop-icon">📁</div>
                                    <div className="drop-text">
                                      <strong>Datei hier hineinziehen</strong><br/>
                                      oder klicken zum Auswählen
                                    </div>
                                    <div className="drop-formats">
                                      PDF, DOC, XLS, JPG, PNG, EML
                                    </div>
                                    
                                    {uploadForm.file && (
                                      <div className="selected-file">
                                        ✓ {uploadForm.file.name}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <input 
                                    type="file" 
                                    id="file-upload"
                                    style={{display: 'none'}}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.eml,.msg"
                                    onChange={(e) => setUploadForm(prev => ({...prev, file: e.target.files[0]}))}
                                  />
                                  
                                  <button 
                                    className="upload-submit-btn"
                                    onClick={() => uploadDocument(kunde.id)}
                                    disabled={!uploadForm.file}
                                    data-testid="upload-submit-btn"
                                  >
                                    📤 Dokument hochladen
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Regular Contracts View
                        <div className="contracts-section">
                          <div className="section-header">
                            <h3>Verträge ({contracts.length})</h3>
                            <button className="btn add-contract-btn" data-testid={`add-contract-btn-${kunde.id}`}>
                              ➕ Neuer Vertrag
                            </button>
                          </div>
                          
                          {contracts.length === 0 ? (
                            <div className="no-contracts">
                              <div className="contracts-table-header">
                                <div className="table-header-row">
                                  <div className="table-header-cell">V-Nr.</div>
                                  <div className="table-header-cell">Gesellschaft</div>
                                  <div className="table-header-cell">Sparte</div>
                                  <div className="table-header-cell">Tarif</div>
                                  <div className="table-header-cell">Status</div>
                                  <div className="table-header-cell">Beginn</div>
                                  <div className="table-header-cell">Beitrag</div>
                                  <div className="table-header-cell">Aktionen</div>
                                </div>
                              </div>
                              <div className="empty-message">
                                Keine Verträge vorhanden.
                              </div>
                            </div>
                          ) : (
                            <div className="contracts-table">
                              <div className="contracts-table-header">
                                <div className="table-header-row">
                                  <div className="table-header-cell">V-Nr.</div>
                                  <div className="table-header-cell">Gesellschaft</div>
                                  <div className="table-header-cell">Sparte</div>
                                  <div className="table-header-cell">Tarif</div>
                                  <div className="table-header-cell">Status</div>
                                  <div className="table-header-cell">Beginn</div>
                                  <div className="table-header-cell">Beitrag</div>
                                  <div className="table-header-cell">Aktionen</div>
                                </div>
                              </div>
                              <div className="contracts-table-body">
                                {contracts.map((vertrag) => (
                                  <div key={vertrag.id} className="table-row" data-testid={`contract-row-${vertrag.id}`}>
                                    <div className="table-cell">{vertrag.vertragsnummer}</div>
                                    <div className="table-cell">{vertrag.gesellschaft}</div>
                                    <div className="table-cell">{vertrag.produkt_sparte}</div>
                                    <div className="table-cell">{vertrag.tarif}</div>
                                    <div className="table-cell">{vertrag.vertragsstatus}</div>
                                    <div className="table-cell">
                                      {vertrag.beginn ? new Date(vertrag.beginn).toLocaleDateString('de-DE') : '-'}
                                    </div>
                                    <div className="table-cell">
                                      {vertrag.beitrag_brutto ? `${vertrag.beitrag_brutto}€` : '-'}
                                    </div>
                                    <div className="table-cell">
                                      <button className="table-btn" data-testid={`edit-contract-btn-${vertrag.id}`}>
                                        ✏️
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

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
                    onClick={performIntelligentSearch}
                    disabled={isSearching}
                    data-testid="search-btn"
                  >
                    {isSearching ? 'Suche...' : 'Suchen'}
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
                    <div className="result-actions">
                      <button 
                        className="result-btn"
                        onClick={() => openCustomerTab(kunde)}
                        data-testid={`open-customer-btn-${kunde.id}`}
                      >
                        👤 Öffnen
                      </button>
                      <button 
                        className="result-btn"
                        onClick={() => handleDocumentResultClick(kunde)}
                        data-testid={`documents-btn-${kunde.id}`}
                      >
                        📄 Dokumente
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Management Window */}
          {documentsVisible && selectedCustomerId && (
            <div 
              className="documents-window"
              style={{ 
                left: `${searchWindow.position.x + 100}px`, 
                top: `${searchWindow.position.y + 100}px` 
              }}
            >
              <div className="window-title">
                📄 Dokumentenverwaltung
                <div className="window-controls">
                  <div className="window-control">_</div>
                  <div className="window-control">□</div>
                  <div className="window-control" onClick={() => setDocumentsVisible(false)}>✕</div>
                </div>
              </div>
              
              <div className="documents-content">
                {/* Upload Section */}
                <div className="upload-section">
                  <h3>Neues Dokument hochladen</h3>
                  <div className="upload-form">
                    <div className="form-group">
                      <label>Titel</label>
                      <input 
                        type="text" 
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({...prev, title: e.target.value}))}
                        placeholder="Dokument Titel"
                        data-testid="document-title-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Beschreibung</label>
                      <textarea 
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({...prev, description: e.target.value}))}
                        placeholder="Beschreibung (optional)"
                        rows="2"
                        data-testid="document-description-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Tags (Komma getrennt)</label>
                      <input 
                        type="text" 
                        value={uploadForm.tags}
                        onChange={(e) => setUploadForm(prev => ({...prev, tags: e.target.value}))}
                        placeholder="vertrag, pdf, wichtig"
                        data-testid="document-tags-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Datei auswählen</label>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.eml,.msg"
                        onChange={(e) => setUploadForm(prev => ({...prev, file: e.target.files[0]}))}
                        data-testid="document-file-input"
                      />
                    </div>
                    <button 
                      className="btn upload-btn"
                      onClick={() => uploadDocument(selectedCustomerId)}
                      disabled={!uploadForm.file}
                      data-testid="upload-document-btn"
                    >
                      📤 Hochladen
                    </button>
                  </div>
                </div>

                {/* Documents List */}
                <div className="documents-list">
                  <h3>Vorhandene Dokumente ({customerDocuments.length})</h3>
                  {customerDocuments.length === 0 ? (
                    <div className="no-documents">
                      Keine Dokumente vorhanden.
                    </div>
                  ) : (
                    <div className="documents-grid">
                      {customerDocuments.map((doc) => (
                        <div key={doc.id} className="document-item" data-testid={`document-item-${doc.id}`}>
                          <div className="document-icon">
                            {doc.document_type === 'pdf' && '📄'}
                            {doc.document_type === 'email' && '✉️'}
                            {doc.document_type === 'word' && '📝'}
                            {doc.document_type === 'excel' && '📊'}
                            {doc.document_type === 'image' && '🖼️'}
                            {doc.document_type === 'other' && '📁'}
                          </div>
                          <div className="document-details">
                            <div className="document-title">{doc.title}</div>
                            <div className="document-filename">{doc.filename}</div>
                            <div className="document-meta">
                              Erstellt: {new Date(doc.created_at).toLocaleDateString('de-DE')}
                            </div>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="document-tags">
                                {doc.tags.map((tag, index) => (
                                  <span key={index} className="tag">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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