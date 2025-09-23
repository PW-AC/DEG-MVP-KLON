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
  // VU Management State
  const [allVUs, setAllVUs] = useState([]);
  const [vuSearchForm, setVuSearchForm] = useState({
    name: '',
    kurzbezeichnung: '',
    status: '',
    ort: '',
    telefon: '',
    email: ''
  });
  const [vuFormVisible, setVuFormVisible] = useState(false);
  const [vuAssignmentDialog, setVuAssignmentDialog] = useState({
    visible: false,
    gesellschaft: '',
    contractData: null,
    matchingVUs: []
  });
  const [newVU, setNewVU] = useState({
    name: '',
    kurzbezeichnung: '',
    status: 'VU',
    strasse: '',
    plz: '',
    ort: '',
    telefon: '',
    telefax: '',
    email_zentrale: '',
    email_schaden: '',
    internet_adresse: '',
    ansprechpartner: '',
    acencia_vermittlernummer: '',
    vu_id: '',
    bemerkung: ''
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
  // Contract Management State
  const [contractFormVisible, setContractFormVisible] = useState(false);
  const [contractFormCustomerId, setContractFormCustomerId] = useState(null);
  const [newContract, setNewContract] = useState({
    vertragsnummer: '',
    interne_vertragsnummer: '',
    gesellschaft: '',
    kfz_kennzeichen: '',
    produkt_sparte: '',
    tarif: '',
    zahlungsweise: '',
    beitrag_brutto: '',
    beitrag_netto: '',
    vertragsstatus: 'aktiv',
    beginn: '',
    ablauf: ''
  });
  const [contractDocuments, setContractDocuments] = useState({});
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [contractDocumentsVisible, setContractDocumentsVisible] = useState({});
  // Customer editing state
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerEditFormVisible, setCustomerEditFormVisible] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({});
  const [lastUpdate, setLastUpdate] = useState(Date.now());

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

  // Check for VU assignment when gesellschaft changes
  const checkVuAssignment = async (gesellschaft, contractData = null) => {
    if (!gesellschaft) return null;

    try {
      const response = await axios.post(`${API}/vus/match-gesellschaft`, null, {
        params: { gesellschaft: gesellschaft }
      });
      
      if (!response.data.match) {
        // No VU found - show assignment dialog
        setVuAssignmentDialog({
          visible: true,
          gesellschaft: gesellschaft,
          contractData: contractData,
          matchingVUs: []
        });
        return null;
      } else {
        // VU found - return VU info
        return response.data.vu;
      }
    } catch (error) {
      console.error('Fehler bei VU-Zuordnung:', error);
      return null;
    }
  };

  // Handle VU assignment dialog actions
  const handleVuAssignmentAction = async (action, data = null) => {
    const { gesellschaft, contractData } = vuAssignmentDialog;

    switch (action) {
      case 'auto_create':
        // Create new VU automatically
        try {
          const newVUData = {
            name: gesellschaft,
            kurzbezeichnung: gesellschaft.substring(0, 10),
            status: 'VU'
          };
          const response = await axios.post(`${API}/vus`, newVUData);
          alert(`VU "${gesellschaft}" wurde automatisch erstellt.`);
          
          // If we have contract data, proceed with contract creation
          if (contractData) {
            contractData.vu_id = response.data.id;
            contractData.vu_internal_id = response.data.vu_internal_id;
            // Continue with contract creation...
          }
          
          setVuAssignmentDialog({ visible: false, gesellschaft: '', contractData: null, matchingVUs: [] });
          await loadAllVUs(); // Reload VU list
        } catch (error) {
          console.error('Fehler beim automatischen VU-Erstellen:', error);
          alert('Fehler beim automatischen VU-Erstellen: ' + (error.response?.data?.detail || error.message));
        }
        break;

      case 'save_without_vu':
        // Save contract without VU assignment
        if (contractData) {
          try {
            const response = await axios.post(`${API}/vertraege`, contractData);
            alert('Vertrag ohne VU-Zuordnung gespeichert.');
            setVuAssignmentDialog({ visible: false, gesellschaft: '', contractData: null, matchingVUs: [] });
          } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern: ' + (error.response?.data?.detail || error.message));
          }
        } else {
          setVuAssignmentDialog({ visible: false, gesellschaft: '', contractData: null, matchingVUs: [] });
        }
        break;

      case 'manual_create':
        // Open VU creation form
        setNewVU({
          name: gesellschaft,
          kurzbezeichnung: gesellschaft.length > 10 ? gesellschaft.substring(0, 10) : gesellschaft,
          status: 'VU',
          strasse: '',
          plz: '',
          ort: '',
          telefon: '',
          telefax: '',
          email_zentrale: '',
          email_schaden: '',
          internet_adresse: '',
          ansprechpartner: '',
          acencia_vermittlernummer: '',
          vu_id: '',
          bemerkung: ''
        });
        setVuFormVisible(true);
        setVuAssignmentDialog({ visible: false, gesellschaft: '', contractData: null, matchingVUs: [] });
        break;

      case 'cancel':
        setVuAssignmentDialog({ visible: false, gesellschaft: '', contractData: null, matchingVUs: [] });
        break;

      default:
        break;
    }
  };

  // Migrate existing contracts
  const migrateExistingContracts = async () => {
    try {
      const response = await axios.post(`${API}/vertraege/migrate-vu-assignments`);
      const results = response.data;
      
      alert(
        `Migration abgeschlossen:\n` +
        `Verarbeitet: ${results.total_contracts} Verträge\n` +
        `Zugeordnet: ${results.matched} VUs\n` +
        `Aktualisiert: ${results.updated} Verträge\n` +
        `Nicht zugeordnet: ${results.unmatched} Verträge`
      );
      
      if (results.unmatched_gesellschaften.length > 0) {
        console.log('Nicht zugeordnete Gesellschaften:', results.unmatched_gesellschaften);
      }
    } catch (error) {
      console.error('Fehler bei Migration:', error);
      alert('Fehler bei Migration: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Handle VU form changes
  const handleVuChange = (field, value) => {
    setNewVU(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle VU search form changes
  const handleVuSearchChange = (field, value) => {
    setVuSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create new VU
  const createVU = async () => {
    try {
      const response = await axios.post(`${API}/vus`, newVU);
      alert('VU erfolgreich erstellt!');
      setVuFormVisible(false);
      setNewVU({
        name: '',
        kurzbezeichnung: '',
        status: 'VU',
        strasse: '',
        plz: '',
        ort: '',
        telefon: '',
        telefax: '',
        email_zentrale: '',
        email_schaden: '',
        internet_adresse: '',
        ansprechpartner: '',
        acencia_vermittlernummer: '',
        vu_id: '',
        bemerkung: ''
      });
      // Reload VUs
      loadAllVUs();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Load all VUs
  const loadAllVUs = async () => {
    try {
      const response = await axios.get(`${API}/vus`);
      setAllVUs(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der VUs:', error);
      setAllVUs([]);
    }
  };

  // Search VUs
  const searchVUs = async () => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(vuSearchForm).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });

      const response = await axios.get(`${API}/vus/search?${searchParams.toString()}`);
      setAllVUs(response.data);
    } catch (error) {
      console.error('Fehler bei der VU-Suche:', error);
      alert('Fehler bei der VU-Suche: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Initialize sample VU data
  const initSampleVUData = async () => {
    try {
      const response = await axios.post(`${API}/vus/init-sample-data`);
      alert(response.data.message);
      await loadAllVUs();
    } catch (error) {
      console.error('Fehler beim Initialisieren der Sample-Daten:', error);
      alert('Fehler beim Initialisieren: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Handle sidebar VU/Ges button click
  const handleVUGesClick = () => {
    setSelectedSidebarItem('vus');
    
    // Create/update VU overview tab
    const vuTab = {
      id: 'tab-vu-overview',
      title: 'VU / Gesellschaften',
      type: 'vu-overview'
    };

    const existingTabIndex = openTabs.findIndex(tab => tab.id === 'tab-vu-overview');
    if (existingTabIndex !== -1) {
      // Tab already exists, just activate it
      setActiveTab('tab-vu-overview');
    } else {
      // Create new tab
      setOpenTabs(prev => [...prev, vuTab]);
      setActiveTab('tab-vu-overview');
    }
    
    // Load VUs
    loadAllVUs();
  };

  // Handle customer editing
  const openCustomerEditForm = (kunde) => {
    setEditingCustomer(kunde);
    setEditCustomerData({
      anrede: kunde.anrede || '',
      titel: kunde.titel || '',
      vorname: kunde.vorname || '',
      name: kunde.name || '',
      zusatz: kunde.zusatz || '',
      strasse: kunde.strasse || '',
      plz: kunde.plz || '',
      ort: kunde.ort || '',
      postfach_plz: kunde.postfach_plz || '',
      postfach_nr: kunde.postfach_nr || '',
      gewerbliche_adresse: kunde.gewerbliche_adresse || false,
      dokumentenmappe_nr: kunde.dokumentenmappe_nr || '',
      betreuer: kunde.betreuer || '',
      betreuer_name: kunde.betreuer_name || '',
      betreuer_firma: kunde.betreuer_firma || '',
      bemerkung: kunde.bemerkung || '',
      selektion: kunde.selektion || '',
      bankverbindung: {
        iban: kunde.bankverbindung?.iban || '',
        bic: kunde.bankverbindung?.bic || '',
        bank: kunde.bankverbindung?.bank || '',
        kontoinhaber: kunde.bankverbindung?.kontoinhaber || ''
      },
      telefon: {
        telefon_privat: kunde.telefon?.telefon_privat || '',
        telefax_privat: kunde.telefon?.telefax_privat || '',
        telefon_geschaeftlich: kunde.telefon?.telefon_geschaeftlich || '',
        telefax_geschaeftlich: kunde.telefon?.telefax_geschaeftlich || '',
        mobiltelefon: kunde.telefon?.mobiltelefon || '',
        ansprechpartner: kunde.telefon?.ansprechpartner || '',
        email: kunde.telefon?.email || '',
        internet_adresse: kunde.telefon?.internet_adresse || ''
      },
      persoenliche_daten: {
        geburtsdatum: kunde.persoenliche_daten?.geburtsdatum || '',
        geburtsname: kunde.persoenliche_daten?.geburtsname || '',
        geburtsort: kunde.persoenliche_daten?.geburtsort || '',
        familienstand: kunde.persoenliche_daten?.familienstand || '',
        nationalitaet: kunde.persoenliche_daten?.nationalitaet || ''
      },
      arbeitgeber: {
        firma: kunde.arbeitgeber?.firma || '',
        strasse: kunde.arbeitgeber?.strasse || '',
        plz: kunde.arbeitgeber?.plz || '',
        ort: kunde.arbeitgeber?.ort || '',
        telefon: kunde.arbeitgeber?.telefon || '',
        ansprechpartner: kunde.arbeitgeber?.ansprechpartner || ''
      }
    });
    setCustomerEditFormVisible(true);
  };

  // Handle edit customer form changes
  const handleEditCustomerChange = (field, value) => {
    const fieldParts = field.split('.');
    if (fieldParts.length === 1) {
      setEditCustomerData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      // Handle nested objects like telefon.email, persoenliche_daten.geburtsdatum
      setEditCustomerData(prev => ({
        ...prev,
        [fieldParts[0]]: {
          ...prev[fieldParts[0]],
          [fieldParts[1]]: value
        }
      }));
    }
  };

  // Reload customer data from backend
  const reloadCustomerData = async (customerId) => {
    try {
      const response = await axios.get(`${API}/kunden/${customerId}`);
      const updatedCustomer = response.data;
      
      // Update customer in all tabs that show this customer
      setOpenTabs(prev => prev.map(tab => 
        tab.type === 'customer-detail' && tab.kunde.id === customerId
          ? { 
              ...tab, 
              kunde: updatedCustomer, 
              title: `${updatedCustomer.vorname} ${updatedCustomer.name}` 
            }
          : tab
      ));
      
      // Update customer in search results if they exist
      setSearchResults(prev => prev.map(kunde => 
        kunde.id === customerId ? updatedCustomer : kunde
      ));
      
      // Update customer in all customers list if it exists
      setAllCustomers(prev => prev.map(kunde => 
        kunde.id === customerId ? updatedCustomer : kunde
      ));
      
      return updatedCustomer;
    } catch (error) {
      console.error('Fehler beim Laden der Kundendaten:', error);
      return null;
    }
  };

  // Update existing customer
  const updateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const response = await axios.put(`${API}/kunden/${editingCustomer.id}`, editCustomerData);
      const updatedCustomer = response.data;
      
      alert('Kunde erfolgreich aktualisiert!');
      setCustomerEditFormVisible(false);
      setEditingCustomer(null);
      setEditCustomerData({});

      // Update customer data in all relevant places immediately
      const currentTab = openTabs.find(tab => tab.id === activeTab);
      
      if (currentTab?.type === 'customer-detail' && currentTab.kunde.id === editingCustomer.id) {
        // Update the customer in the active tab with the response data
        setOpenTabs(prev => prev.map(tab => 
          tab.id === activeTab 
            ? { 
                ...tab, 
                kunde: updatedCustomer, 
                title: `${updatedCustomer.vorname} ${updatedCustomer.name}` 
              }
            : tab
        ));
      }
      
      // Update customer in search results if they exist
      if (searchResults.length > 0) {
        setSearchResults(prev => prev.map(kunde => 
          kunde.id === editingCustomer.id ? updatedCustomer : kunde
        ));
      }
      
      // Update customer in all customers list if it exists
      setAllCustomers(prev => prev.map(kunde => 
        kunde.id === editingCustomer.id ? updatedCustomer : kunde
      ));

      // Also reload data from backend to ensure consistency
      await reloadCustomerData(editingCustomer.id);

    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Handle contract form changes
  const handleContractChange = (field, value) => {
    setNewContract(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Open contract creation form
  const openContractForm = (kundeId) => {
    setContractFormCustomerId(kundeId);
    setNewContract({
      vertragsnummer: '',
      interne_vertragsnummer: '',
      gesellschaft: '',
      kfz_kennzeichen: '',
      produkt_sparte: '',
      tarif: '',
      zahlungsweise: '',
      beitrag_brutto: '',
      beitrag_netto: '',
      vertragsstatus: 'aktiv',
      beginn: '',
      ablauf: ''
    });
    setContractFormVisible(true);
  };

  // Create new contract
  const createContract = async () => {
    try {
      const contractData = {
        ...newContract,
        kunde_id: contractFormCustomerId,
        beginn: newContract.beginn || null,
        ablauf: newContract.ablauf || null,
        beitrag_brutto: newContract.beitrag_brutto ? parseFloat(newContract.beitrag_brutto) : null,
        beitrag_netto: newContract.beitrag_netto ? parseFloat(newContract.beitrag_netto) : null
      };
      
      const response = await axios.post(`${API}/vertraege`, contractData);
      alert('Vertrag erfolgreich erstellt!');
      setContractFormVisible(false);
      setContractFormCustomerId(null);
      
      // Reload customer contracts
      if (contractFormCustomerId) {
        await loadCustomerContracts(contractFormCustomerId);
      }
      
    } catch (error) {
      console.error('Fehler beim Erstellen des Vertrags:', error);
      alert('Fehler beim Erstellen: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Load contract documents
  const loadContractDocuments = async (contractId) => {
    try {
      const response = await axios.get(`${API}/documents?vertrag_id=${contractId}`);
      setContractDocuments(prev => ({
        ...prev,
        [contractId]: response.data
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Vertragsdokumente:', error);
      setContractDocuments(prev => ({
        ...prev,
        [contractId]: []
      }));
    }
  };

  // Upload contract document
  const uploadContractDocument = async (contractId) => {
    if (!uploadForm.file) {
      alert('Bitte wählen Sie eine Datei aus.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = btoa(e.target.result);
        
        const formData = new FormData();
        formData.append('vertrag_id', contractId);
        formData.append('title', uploadForm.title || uploadForm.file.name);
        formData.append('description', uploadForm.description);
        formData.append('tags', uploadForm.tags);
        formData.append('file_content', base64Content);

        const response = await axios.post(`${API}/documents/upload`, formData);
        alert('Vertragsdokument erfolgreich hochgeladen!');
        
        // Reset form
        setUploadForm({ title: '', description: '', tags: '', file: null });
        
        // Reload contract documents
        await loadContractDocuments(contractId);
      };
      reader.readAsBinaryString(uploadForm.file);
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      alert('Fehler beim Hochladen: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Toggle contract documents view
  const toggleContractDocuments = (contractId) => {
    setContractDocumentsVisible(prev => ({
      ...prev,
      [contractId]: !prev[contractId]
    }));
    
    if (!contractDocumentsVisible[contractId]) {
      loadContractDocuments(contractId);
    }
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

  // Handle customer merge
  const handleMergeCustomers = (customerIds) => {
    const warningInfo = duplicateWarning ? 
      `\nÜbereinstimmungen (${duplicateWarning.matchCount}): ${duplicateWarning.matches.join(', ')}` : '';
    
    // For now, show confirmation dialog
    const confirmMerge = window.confirm(
      `Möchten Sie die Kunden ${customerIds.join(' und ')} wirklich zusammenführen?${warningInfo}\n\n` +
      'Diese Aktion kann nicht rückgängig gemacht werden.'
    );
    
    if (confirmMerge) {
      // TODO: Implement actual merge logic
      alert('Zusammenführung wird implementiert...');
      // After merge, clear the warning
      setDuplicateWarning(null);
    }
  };

  // Check for duplicate customers based on multiple attributes (minimum 4 matches required)
  const checkForDuplicates = (customers) => {
    const duplicates = [];
    
    for (let i = 0; i < customers.length; i++) {
      for (let j = i + 1; j < customers.length; j++) {
        const customer1 = customers[i];
        const customer2 = customers[j];
        
        let matchCount = 0;
        const matches = [];
        
        // Compare all customer attributes
        
        // Name comparison
        if (customer1.name && customer2.name && 
            customer1.name.toLowerCase().trim() === customer2.name.toLowerCase().trim()) {
          matchCount++;
          matches.push('Name');
        }
        
        // Vorname comparison
        if (customer1.vorname && customer2.vorname && 
            customer1.vorname.toLowerCase().trim() === customer2.vorname.toLowerCase().trim()) {
          matchCount++;
          matches.push('Vorname');
        }
        
        // Straße comparison
        if (customer1.strasse && customer2.strasse && 
            customer1.strasse.toLowerCase().trim() === customer2.strasse.toLowerCase().trim()) {
          matchCount++;
          matches.push('Straße');
        }
        
        // PLZ comparison
        if (customer1.plz && customer2.plz && 
            customer1.plz.trim() === customer2.plz.trim()) {
          matchCount++;
          matches.push('PLZ');
        }
        
        // Ort comparison
        if (customer1.ort && customer2.ort && 
            customer1.ort.toLowerCase().trim() === customer2.ort.toLowerCase().trim()) {
          matchCount++;
          matches.push('Ort');
        }
        
        // Telefon comparison
        if (customer1.telefon?.telefon_privat && customer2.telefon?.telefon_privat && 
            customer1.telefon.telefon_privat.trim() === customer2.telefon.telefon_privat.trim()) {
          matchCount++;
          matches.push('Telefon');
        }
        
        // Email comparison
        if (customer1.telefon?.email && customer2.telefon?.email && 
            customer1.telefon.email.toLowerCase().trim() === customer2.telefon.email.toLowerCase().trim()) {
          matchCount++;
          matches.push('E-Mail');
        }
        
        // Geburtsdatum comparison
        if (customer1.persoenliche_daten?.geburtsdatum && customer2.persoenliche_daten?.geburtsdatum && 
            customer1.persoenliche_daten.geburtsdatum === customer2.persoenliche_daten.geburtsdatum) {
          matchCount++;
          matches.push('Geburtsdatum');
        }
        
        // Anrede comparison
        if (customer1.anrede && customer2.anrede && 
            customer1.anrede === customer2.anrede) {
          matchCount++;
          matches.push('Anrede');
        }
        
        // Titel comparison
        if (customer1.titel && customer2.titel && 
            customer1.titel.toLowerCase().trim() === customer2.titel.toLowerCase().trim()) {
          matchCount++;
          matches.push('Titel');
        }
        
        // Postfach comparison
        if (customer1.postfach_plz && customer2.postfach_plz && 
            customer1.postfach_plz.trim() === customer2.postfach_plz.trim()) {
          matchCount++;
          matches.push('Postfach-PLZ');
        }
        
        // Bankverbindung IBAN comparison
        if (customer1.bankverbindung?.iban && customer2.bankverbindung?.iban && 
            customer1.bankverbindung.iban.trim() === customer2.bankverbindung.iban.trim()) {
          matchCount++;
          matches.push('IBAN');
        }
        
        // Check if we have at least 4 matching attributes
        if (matchCount >= 4) {
          const existingDuplicate = duplicates.find(dup => 
            dup.ids.includes(customer1.kunde_id) || dup.ids.includes(customer2.kunde_id)
          );
          
          if (!existingDuplicate) {
            duplicates.push({
              ids: [customer1.kunde_id, customer2.kunde_id],
              matchCount: matchCount,
              matches: matches
            });
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
      
      // Check for duplicates in search results
      const duplicates = checkForDuplicates(results);
      if (duplicates.length > 0) {
        // Show duplicate warning with match count only
        const duplicate = duplicates[0]; // Show first duplicate pair found
        setDuplicateWarning({
          message: `Potenzielle Dublette gefunden: ${duplicate.ids.join(' und ')} (${duplicate.matchCount} Übereinstimmungen)`,
          ids: duplicate.ids,
          matchCount: duplicate.matchCount,
          matches: duplicate.matches
        });
      } else {
        setDuplicateWarning(null);
      }
      
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
            onClick={() => {setSelectedSidebarItem('search'); setSearchWindow(prev => ({...prev, visible: true}));}}
            data-testid="search-sidebar-btn"
          >
            🔍 Suchen
          </button>
          <button 
            className={`sidebar-item ${selectedSidebarItem === 'newcustomer' ? 'selected' : ''}`}
            onClick={() => {setSelectedSidebarItem('newcustomer'); setCustomerFormVisible(true);}}
            data-testid="newcustomer-sidebar-btn"
          >
            👤 Kunden Neuerfassen
          </button>
          <button 
            className={`sidebar-item ${selectedSidebarItem === 'vus' ? 'selected' : ''}`}
            onClick={handleVUGesClick}
            data-testid="vus-sidebar-btn"
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
          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="duplicate-warning" data-testid="duplicate-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">{duplicateWarning.message}</div>
              <button 
                className="merge-btn" 
                onClick={() => handleMergeCustomers(duplicateWarning.ids)}
                data-testid="merge-customers-btn"
              >
                Kunden & Vertragsdaten zusammenführen
              </button>
              <div className="warning-close" onClick={() => setDuplicateWarning(null)}>✕</div>
            </div>
          )}

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
                                <div className={`all-customers-cell ${duplicateWarning && duplicateWarning.ids.includes(kunde.kunde_id) ? 'duplicate-kid' : ''}`}>
                                  {kunde.kunde_id || '-'}
                                </div>
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
                    <div 
                      key={`customer-${kunde.id}-${kunde.updated_at || lastUpdate}`}
                      className="customer-tab-content" 
                      data-testid={`customer-tab-content-${kunde.id}`}
                    >
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
                            onClick={() => openCustomerEditForm(kunde)}
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
                            <button 
                              className="btn add-contract-btn" 
                              onClick={() => openContractForm(kunde.id)}
                              data-testid={`add-contract-btn-${kunde.id}`}
                            >
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
                                      <div className="contract-actions">
                                        <button 
                                          className="table-btn" 
                                          onClick={() => toggleContractDocuments(vertrag.id)}
                                          data-testid={`contract-docs-btn-${vertrag.id}`}
                                          title="Vertragsdokumente"
                                        >
                                          📄
                                        </button>
                                        <button 
                                          className="table-btn" 
                                          data-testid={`edit-contract-btn-${vertrag.id}`}
                                          title="Vertrag bearbeiten"
                                        >
                                          ✏️
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Contract Documents Sections */}
                          {Object.keys(contractDocumentsVisible).map(contractId => {
                            if (!contractDocumentsVisible[contractId]) return null;
                            
                            const contract = contracts.find(c => c.id === contractId);
                            const documents = contractDocuments[contractId] || [];
                            
                            return (
                              <div key={contractId} className="contract-documents-section">
                                <div className="contract-documents-header">
                                  <h4>📄 Dokumente für Vertrag: {contract?.vertragsnummer || contractId}</h4>
                                  <button 
                                    className="btn close-contract-docs-btn"
                                    onClick={() => toggleContractDocuments(contractId)}
                                  >
                                    ✕ Schließen
                                  </button>
                                </div>
                                
                                <div className="documents-main-content">
                                  {/* Left Panel - Documents List */}
                                  <div className="documents-list-panel">
                                    <div className="documents-list-header">
                                      <h4>Dokumentenliste ({documents.length})</h4>
                                    </div>
                                    <div className="documents-tree">
                                      {documents.length === 0 ? (
                                        <div className="empty-documents">
                                          <div className="folder-icon">📁</div>
                                          <div className="empty-text">Keine Dokumente vorhanden</div>
                                        </div>
                                      ) : (
                                        <div className="documents-table">
                                          <div className="documents-table-header">
                                            <div className="doc-header-cell">Name</div>
                                            <div className="doc-header-cell">Eingepflegt am</div>
                                          </div>
                                          <div className="documents-table-body">
                                            {documents.map((doc) => (
                                              <div key={doc.id} className="document-row">
                                                <div className="doc-cell doc-name-cell">
                                                  <div className="document-icon">
                                                    {doc.document_type === 'pdf' && '📄'}
                                                    {doc.document_type === 'email' && '✉️'}
                                                    {doc.document_type === 'word' && '📝'}
                                                    {doc.document_type === 'excel' && '📊'}
                                                    {doc.document_type === 'other' && '📁'}
                                                  </div>
                                                  <div className="document-filename">{doc.title}</div>
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

                                  {/* Right Panel - Upload */}
                                  <div className="upload-panel">
                                    <div className="upload-header">
                                      <h4>📤 Neues Dokument hochladen</h4>
                                    </div>
                                    <div className="upload-form-panel">
                                      <div className="upload-fields">
                                        <div className="upload-field">
                                          <label>Titel:</label>
                                          <input 
                                            type="text" 
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm(prev => ({...prev, title: e.target.value}))}
                                            placeholder="Dokumententitel"
                                          />
                                        </div>
                                        
                                        <div className="upload-field">
                                          <label>Beschreibung:</label>
                                          <input 
                                            type="text" 
                                            value={uploadForm.description}
                                            onChange={(e) => setUploadForm(prev => ({...prev, description: e.target.value}))}
                                            placeholder="Kurze Beschreibung"
                                          />
                                        </div>
                                        
                                        <div className="upload-field">
                                          <label>Tags:</label>
                                          <input 
                                            type="text" 
                                            value={uploadForm.tags}
                                            onChange={(e) => setUploadForm(prev => ({...prev, tags: e.target.value}))}
                                            placeholder="wichtig, vertrag, 2024"
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="drag-drop-area">
                                        <div 
                                          className="drop-zone-large" 
                                          onClick={() => document.getElementById(`contract-file-input-${contractId}`).click()}
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
                                          id={`contract-file-input-${contractId}`}
                                          type="file"
                                          style={{ display: 'none' }}
                                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.eml"
                                          onChange={(e) => setUploadForm(prev => ({...prev, file: e.target.files[0]}))}
                                        />
                                      </div>
                                      
                                      <button 
                                        className="upload-submit-btn"
                                        onClick={() => uploadContractDocument(contractId)}
                                        disabled={!uploadForm.file}
                                      >
                                        📤 Hochladen
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                if (currentTab.type === 'vu-overview') {
                  return (
                    <div className="vu-overview-tab-content">
                      <div className="vu-overview-header">
                        <h3>Versicherungsgesellschaften / VU</h3>
                        <div className="vu-overview-actions">
                          <button 
                            className="btn"
                            onClick={() => setVuFormVisible(true)}
                            data-testid="new-vu-btn"
                          >
                            📄 Neu anlegen
                          </button>
                          <button 
                            className="btn"
                            onClick={initSampleVUData}
                            data-testid="init-sample-vu-btn"
                          >
                            🔧 Sample Daten
                          </button>
                          <button 
                            className="btn"
                            onClick={migrateExistingContracts}
                            data-testid="migrate-contracts-btn"
                          >
                            🔄 Verträge migrieren
                          </button>
                        </div>
                      </div>

                      {/* VU Search Form */}
                      <div className="vu-search-section">
                        <div className="vu-search-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Name</label>
                              <input
                                type="text"
                                value={vuSearchForm.name}
                                onChange={(e) => handleVuSearchChange('name', e.target.value)}
                                placeholder="Gesellschaftsname..."
                              />
                            </div>
                            <div className="form-group">
                              <label>Kürzel</label>
                              <input
                                type="text"
                                value={vuSearchForm.kurzbezeichnung}
                                onChange={(e) => handleVuSearchChange('kurzbezeichnung', e.target.value)}
                                placeholder="Kürzel..."
                              />
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <select
                                value={vuSearchForm.status}
                                onChange={(e) => handleVuSearchChange('status', e.target.value)}
                              >
                                <option value="">Alle</option>
                                <option value="VU">VU</option>
                                <option value="Pool">Pool</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Ort</label>
                              <input
                                type="text"
                                value={vuSearchForm.ort}
                                onChange={(e) => handleVuSearchChange('ort', e.target.value)}
                                placeholder="Ort..."
                              />
                            </div>
                            <div className="form-group">
                              <label>E-Mail</label>
                              <input
                                type="email"
                                value={vuSearchForm.email}
                                onChange={(e) => handleVuSearchChange('email', e.target.value)}
                                placeholder="E-Mail..."
                              />
                            </div>
                            <div className="form-group">
                              <label>&nbsp;</label>
                              <div className="search-buttons">
                                <button 
                                  className="btn"
                                  onClick={searchVUs}
                                  data-testid="search-vus-btn"
                                >
                                  🔍 Suchen
                                </button>
                                <button 
                                  className="btn"
                                  onClick={loadAllVUs}
                                  data-testid="load-all-vus-btn"
                                >
                                  📋 Alle anzeigen
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* VU Table */}
                      <div className="vu-table">
                        <div className="vu-table-header">
                          <div className="vu-header-row">
                            <div className="vu-header-cell">Status</div>
                            <div className="vu-header-cell">Interne ID</div>
                            <div className="vu-header-cell">Name</div>
                            <div className="vu-header-cell">Kürzel</div>
                            <div className="vu-header-cell">Adresse</div>
                            <div className="vu-header-cell">Telefon</div>
                            <div className="vu-header-cell">E-Mail</div>
                          </div>
                        </div>
                        <div className="vu-table-body">
                          {allVUs.length === 0 ? (
                            <div className="no-vus-message">
                              Keine VUs gefunden. Verwenden Sie "Sample Daten" zum Initialisieren.
                            </div>
                          ) : (
                            allVUs.map((vu) => (
                              <div key={vu.id} className="vu-row" data-testid={`vu-row-${vu.id}`}>
                                <div className="vu-cell">
                                  <span className={`status-badge ${vu.status.toLowerCase()}`}>
                                    {vu.status}
                                  </span>
                                </div>
                                <div className="vu-cell vu-internal-id-cell">
                                  <strong>{vu.vu_internal_id || '-'}</strong>
                                </div>
                                <div className="vu-cell vu-name-cell">{vu.name}</div>
                                <div className="vu-cell">{vu.kurzbezeichnung || '-'}</div>
                                <div className="vu-cell">
                                  {vu.strasse && vu.plz && vu.ort 
                                    ? `${vu.strasse}, ${vu.plz} ${vu.ort}` 
                                    : (vu.ort || '-')
                                  }
                                </div>
                                <div className="vu-cell">{vu.telefon || '-'}</div>
                                <div className="vu-cell">{vu.email_zentrale || '-'}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
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

          {/* Customer Edit Form Window */}
          {customerEditFormVisible && (
            <div 
              className="search-window"
              style={{ 
                left: `50px`, 
                top: `50px`,
                width: '900px',
                height: '600px',
                overflowY: 'auto'
              }}
            >
              <div className="window-title">
                ✏️ Kunde bearbeiten: {editingCustomer?.vorname} {editingCustomer?.name} (K-ID: {editingCustomer?.kunde_id})
                <div className="window-controls">
                  <div className="window-control">_</div>
                  <div className="window-control">□</div>
                  <div className="window-control" onClick={() => setCustomerEditFormVisible(false)}>✕</div>
                </div>
              </div>
              
              <div className="form-content customer-form">
                {/* Basic Information */}
                <div className="form-section">
                  <h4>👤 Stammdaten</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Anrede</label>
                      <select 
                        value={editCustomerData.anrede}
                        onChange={(e) => handleEditCustomerChange('anrede', e.target.value)}
                        data-testid="edit-anrede-select"
                      >
                        <option value="">Bitte wählen</option>
                        <option value="Herr">Herr</option>
                        <option value="Frau">Frau</option>
                        <option value="Divers">Divers</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Titel</label>
                      <input 
                        type="text" 
                        value={editCustomerData.titel}
                        onChange={(e) => handleEditCustomerChange('titel', e.target.value)}
                        placeholder="Dr., Prof., etc."
                        data-testid="edit-titel-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Vorname *</label>
                      <input 
                        type="text" 
                        value={editCustomerData.vorname}
                        onChange={(e) => handleEditCustomerChange('vorname', e.target.value)}
                        placeholder="Vorname"
                        data-testid="edit-vorname-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Name *</label>
                      <input 
                        type="text" 
                        value={editCustomerData.name}
                        onChange={(e) => handleEditCustomerChange('name', e.target.value)}
                        placeholder="Nachname"
                        data-testid="edit-name-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Zusatz</label>
                    <input 
                      type="text" 
                      value={editCustomerData.zusatz}
                      onChange={(e) => handleEditCustomerChange('zusatz', e.target.value)}
                      placeholder="Zusatz zum Namen"
                      data-testid="edit-zusatz-input"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="form-section">
                  <h4>🏠 Adresse</h4>
                  <div className="form-group">
                    <label>Straße</label>
                    <input 
                      type="text" 
                      value={editCustomerData.strasse}
                      onChange={(e) => handleEditCustomerChange('strasse', e.target.value)}
                      placeholder="Straße und Hausnummer"
                      data-testid="edit-strasse-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>PLZ</label>
                      <input 
                        type="text" 
                        value={editCustomerData.plz}
                        onChange={(e) => handleEditCustomerChange('plz', e.target.value)}
                        placeholder="PLZ"
                        data-testid="edit-plz-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Ort</label>
                      <input 
                        type="text" 
                        value={editCustomerData.ort}
                        onChange={(e) => handleEditCustomerChange('ort', e.target.value)}
                        placeholder="Ort"
                        data-testid="edit-ort-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="form-section">
                  <h4>📞 Kontaktdaten</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Telefon privat</label>
                      <input 
                        type="tel" 
                        value={editCustomerData.telefon?.telefon_privat}
                        onChange={(e) => handleEditCustomerChange('telefon.telefon_privat', e.target.value)}
                        placeholder="Telefonnummer privat"
                        data-testid="edit-telefon-privat-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Telefon geschäftlich</label>
                      <input 
                        type="tel" 
                        value={editCustomerData.telefon?.telefon_geschaeftlich}
                        onChange={(e) => handleEditCustomerChange('telefon.telefon_geschaeftlich', e.target.value)}
                        placeholder="Telefonnummer geschäftlich"
                        data-testid="edit-telefon-geschaeftlich-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Mobiltelefon</label>
                      <input 
                        type="tel" 
                        value={editCustomerData.telefon?.mobiltelefon}
                        onChange={(e) => handleEditCustomerChange('telefon.mobiltelefon', e.target.value)}
                        placeholder="Mobilnummer"
                        data-testid="edit-mobiltelefon-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>E-Mail</label>
                      <input 
                        type="email" 
                        value={editCustomerData.telefon?.email}
                        onChange={(e) => handleEditCustomerChange('telefon.email', e.target.value)}
                        placeholder="E-Mail Adresse"
                        data-testid="edit-email-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="form-section">
                  <h4>👤 Persönliche Daten</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Geburtsdatum</label>
                      <input 
                        type="date" 
                        value={editCustomerData.persoenliche_daten?.geburtsdatum}
                        onChange={(e) => handleEditCustomerChange('persoenliche_daten.geburtsdatum', e.target.value)}
                        data-testid="edit-geburtsdatum-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Familienstand</label>
                      <select 
                        value={editCustomerData.persoenliche_daten?.familienstand}
                        onChange={(e) => handleEditCustomerChange('persoenliche_daten.familienstand', e.target.value)}
                        data-testid="edit-familienstand-select"
                      >
                        <option value="">Bitte wählen</option>
                        <option value="ledig">ledig</option>
                        <option value="verheiratet">verheiratet</option>
                        <option value="geschieden">geschieden</option>
                        <option value="verwitwet">verwitwet</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nationalität</label>
                    <input 
                      type="text" 
                      value={editCustomerData.persoenliche_daten?.nationalitaet}
                      onChange={(e) => handleEditCustomerChange('persoenliche_daten.nationalitaet', e.target.value)}
                      placeholder="Nationalität"
                      data-testid="edit-nationalitaet-input"
                    />
                  </div>
                </div>

                {/* Bank Information */}
                <div className="form-section">
                  <h4>🏦 Bankverbindung</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>IBAN</label>
                      <input 
                        type="text" 
                        value={editCustomerData.bankverbindung?.iban}
                        onChange={(e) => handleEditCustomerChange('bankverbindung.iban', e.target.value)}
                        placeholder="DE89 3704 0044 0532 0130 00"
                        data-testid="edit-iban-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>BIC</label>
                      <input 
                        type="text" 
                        value={editCustomerData.bankverbindung?.bic}
                        onChange={(e) => handleEditCustomerChange('bankverbindung.bic', e.target.value)}
                        placeholder="COBADEFFXXX"
                        data-testid="edit-bic-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Bank</label>
                      <input 
                        type="text" 
                        value={editCustomerData.bankverbindung?.bank}
                        onChange={(e) => handleEditCustomerChange('bankverbindung.bank', e.target.value)}
                        placeholder="Bankname"
                        data-testid="edit-bank-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Kontoinhaber</label>
                      <input 
                        type="text" 
                        value={editCustomerData.bankverbindung?.kontoinhaber}
                        onChange={(e) => handleEditCustomerChange('bankverbindung.kontoinhaber', e.target.value)}
                        placeholder="Name des Kontoinhabers"
                        data-testid="edit-kontoinhaber-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-section">
                  <h4>📝 Bemerkungen</h4>
                  <div className="form-group full-width">
                    <label>Bemerkung</label>
                    <textarea 
                      value={editCustomerData.bemerkung}
                      onChange={(e) => handleEditCustomerChange('bemerkung', e.target.value)}
                      placeholder="Zusätzliche Bemerkungen"
                      rows="3"
                      data-testid="edit-bemerkung-textarea"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-bottom">
                <div></div>
                <div className="form-buttons">
                  <button 
                    className="btn" 
                    onClick={updateCustomer}
                    disabled={!editCustomerData.vorname || !editCustomerData.name}
                    data-testid="update-customer-btn"
                  >
                    💾 Speichern
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => setCustomerEditFormVisible(false)}
                    data-testid="cancel-edit-customer-btn"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contract Form Window */}
          {contractFormVisible && (
            <div 
              className="search-window"
              style={{ 
                left: `100px`, 
                top: `80px`,
                width: '800px'
              }}
            >
              <div className="window-title">
                📄 Neuer Vertrag erstellen
                <div className="window-controls">
                  <div className="window-control">_</div>
                  <div className="window-control">□</div>
                  <div className="window-control" onClick={() => setContractFormVisible(false)}>✕</div>
                </div>
              </div>
              
              <div className="form-content customer-form">
                <div className="form-group">
                  <label>Vertragsnummer</label>
                  <input 
                    type="text" 
                    value={newContract.vertragsnummer}
                    onChange={(e) => handleContractChange('vertragsnummer', e.target.value)}
                    placeholder="Vertragsnummer"
                    data-testid="contract-number-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Interne Vertragsnummer (AiN)</label>
                  <input 
                    type="text" 
                    value={newContract.interne_vertragsnummer}
                    onChange={(e) => handleContractChange('interne_vertragsnummer', e.target.value)}
                    placeholder="Interne Nummer"
                    data-testid="contract-internal-number-input"
                  />
                </div>

                <div className="form-group">
                  <label>Gesellschaft *</label>
                  <input 
                    type="text" 
                    value={newContract.gesellschaft}
                    onChange={(e) => handleContractChange('gesellschaft', e.target.value)}
                    placeholder="Versicherungsgesellschaft"
                    data-testid="contract-gesellschaft-input"
                  />
                </div>

                <div className="form-group">
                  <label>KFZ-Kennzeichen</label>
                  <input 
                    type="text" 
                    value={newContract.kfz_kennzeichen}
                    onChange={(e) => handleContractChange('kfz_kennzeichen', e.target.value)}
                    placeholder="KFZ-Kennzeichen"
                    data-testid="contract-license-plate-input"
                  />
                </div>

                <div className="form-group">
                  <label>Produkt / Sparte</label>
                  <input 
                    type="text" 
                    value={newContract.produkt_sparte}
                    onChange={(e) => handleContractChange('produkt_sparte', e.target.value)}
                    placeholder="z.B. KFZ, Haftpflicht, Leben"
                    data-testid="contract-product-input"
                  />
                </div>

                <div className="form-group">
                  <label>Tarif</label>
                  <input 
                    type="text" 
                    value={newContract.tarif}
                    onChange={(e) => handleContractChange('tarif', e.target.value)}
                    placeholder="Tarif"
                    data-testid="contract-tarif-input"
                  />
                </div>

                <div className="form-group">
                  <label>Zahlungsweise</label>
                  <select 
                    value={newContract.zahlungsweise}
                    onChange={(e) => handleContractChange('zahlungsweise', e.target.value)}
                    data-testid="contract-payment-select"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="monatlich">monatlich</option>
                    <option value="vierteljährlich">vierteljährlich</option>
                    <option value="halbjährlich">halbjährlich</option>
                    <option value="jährlich">jährlich</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Beitrag brutto (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newContract.beitrag_brutto}
                    onChange={(e) => handleContractChange('beitrag_brutto', e.target.value)}
                    placeholder="0.00"
                    data-testid="contract-premium-gross-input"
                  />
                </div>

                <div className="form-group">
                  <label>Beitrag netto (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newContract.beitrag_netto}
                    onChange={(e) => handleContractChange('beitrag_netto', e.target.value)}
                    placeholder="0.00"
                    data-testid="contract-premium-net-input"
                  />
                </div>

                <div className="form-group">
                  <label>Vertragsstatus</label>
                  <select 
                    value={newContract.vertragsstatus}
                    onChange={(e) => handleContractChange('vertragsstatus', e.target.value)}
                    data-testid="contract-status-select"
                  >
                    <option value="aktiv">aktiv</option>
                    <option value="gekündigt">gekündigt</option>
                    <option value="ruhend">ruhend</option>
                    <option value="storniert">storniert</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Vertragsbeginn</label>
                  <input 
                    type="date" 
                    value={newContract.beginn}
                    onChange={(e) => handleContractChange('beginn', e.target.value)}
                    data-testid="contract-start-date-input"
                  />
                </div>

                <div className="form-group">
                  <label>Vertragsablauf</label>
                  <input 
                    type="date" 
                    value={newContract.ablauf}
                    onChange={(e) => handleContractChange('ablauf', e.target.value)}
                    data-testid="contract-end-date-input"
                  />
                </div>
              </div>
              
              <div className="form-bottom">
                <div></div>
                <div className="form-buttons">
                  <button 
                    className="btn" 
                    onClick={createContract}
                    disabled={!newContract.gesellschaft}
                    data-testid="create-contract-btn"
                  >
                    Erstellen
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => setContractFormVisible(false)}
                    data-testid="cancel-contract-btn"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VU Assignment Dialog */}
          {vuAssignmentDialog.visible && (
            <div 
              className="search-window"
              style={{ 
                left: `200px`, 
                top: `150px`,
                width: '600px'
              }}
            >
              <div className="window-title">
                ⚠️ VU-Zuordnung erforderlich
                <div className="window-controls">
                  <div className="window-control">_</div>
                  <div className="window-control">□</div>
                  <div className="window-control" onClick={() => handleVuAssignmentAction('cancel')}>✕</div>
                </div>
              </div>
              
              <div className="form-content">
                <div className="vu-assignment-message">
                  <h3>Keine VU gefunden für: "{vuAssignmentDialog.gesellschaft}"</h3>
                  <p>Bitte wählen Sie eine der folgenden Optionen:</p>
                </div>

                <div className="vu-assignment-options">
                  <div className="assignment-option">
                    <button 
                      className="btn assignment-btn auto-create"
                      onClick={() => handleVuAssignmentAction('auto_create')}
                      data-testid="auto-create-vu-btn"
                    >
                      🤖 VU automatisch anlegen
                    </button>
                    <p className="option-description">
                      Erstellt automatisch eine neue VU mit dem Namen "{vuAssignmentDialog.gesellschaft}"
                    </p>
                  </div>

                  <div className="assignment-option">
                    <button 
                      className="btn assignment-btn manual-create"
                      onClick={() => handleVuAssignmentAction('manual_create')}
                      data-testid="manual-create-vu-btn"
                    >
                      ✏️ VU manuell anlegen
                    </button>
                    <p className="option-description">
                      Öffnet das VU-Erstellungsformular zum manuellen Eingeben aller Daten
                    </p>
                  </div>

                  <div className="assignment-option">
                    <button 
                      className="btn assignment-btn save-without"
                      onClick={() => handleVuAssignmentAction('save_without_vu')}
                      data-testid="save-without-vu-btn"
                    >
                      📋 Ohne VU-Zuordnung speichern
                    </button>
                    <p className="option-description">
                      Speichert den Vertrag ohne VU-Zuordnung (kann später nachgetragen werden)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="form-bottom">
                <div></div>
                <div className="form-buttons">
                  <button 
                    className="btn" 
                    onClick={() => handleVuAssignmentAction('cancel')}
                    data-testid="cancel-assignment-btn"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VU Form Window */}
          {vuFormVisible && (
            <div 
              className="search-window"
              style={{ 
                left: `100px`, 
                top: `80px`,
                width: '800px'
              }}
            >
              <div className="window-title">
                📄 Neue VU / Gesellschaft anlegen
                <div className="window-controls">
                  <div className="window-control">_</div>
                  <div className="window-control">□</div>
                  <div className="window-control" onClick={() => setVuFormVisible(false)}>✕</div>
                </div>
              </div>
              
              <div className="form-content customer-form">
                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    value={newVU.name}
                    onChange={(e) => handleVuChange('name', e.target.value)}
                    placeholder="Vollständiger Gesellschaftsname"
                    data-testid="vu-name-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Kürzel</label>
                  <input 
                    type="text" 
                    value={newVU.kurzbezeichnung}
                    onChange={(e) => handleVuChange('kurzbezeichnung', e.target.value)}
                    placeholder="Kurze Bezeichnung"
                    data-testid="vu-kurzel-input"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={newVU.status}
                    onChange={(e) => handleVuChange('status', e.target.value)}
                    data-testid="vu-status-select"
                  >
                    <option value="VU">VU (Versicherungsunternehmen)</option>
                    <option value="Pool">Pool</option>
                  </select>
                </div>

                <div className="form-row-address">
                  <div className="form-group">
                    <label>Straße</label>
                    <input 
                      type="text" 
                      value={newVU.strasse}
                      onChange={(e) => handleVuChange('strasse', e.target.value)}
                      placeholder="Straße und Hausnummer"
                      data-testid="vu-strasse-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>PLZ</label>
                    <input 
                      type="text" 
                      value={newVU.plz}
                      onChange={(e) => handleVuChange('plz', e.target.value)}
                      placeholder="PLZ"
                      data-testid="vu-plz-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Ort</label>
                    <input 
                      type="text" 
                      value={newVU.ort}
                      onChange={(e) => handleVuChange('ort', e.target.value)}
                      placeholder="Ort"
                      data-testid="vu-ort-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Telefon</label>
                  <input 
                    type="text" 
                    value={newVU.telefon}
                    onChange={(e) => handleVuChange('telefon', e.target.value)}
                    placeholder="Telefonnummer"
                    data-testid="vu-telefon-input"
                  />
                </div>

                <div className="form-group">
                  <label>Telefax</label>
                  <input 
                    type="text" 
                    value={newVU.telefax}
                    onChange={(e) => handleVuChange('telefax', e.target.value)}
                    placeholder="Faxnummer"
                    data-testid="vu-telefax-input"
                  />
                </div>

                <div className="form-group">
                  <label>Internet</label>
                  <input 
                    type="text" 
                    value={newVU.internet_adresse}
                    onChange={(e) => handleVuChange('internet_adresse', e.target.value)}
                    placeholder="www.beispiel.de"
                    data-testid="vu-internet-input"
                  />
                </div>

                <div className="form-group">
                  <label>E-Mail Zentrale</label>
                  <input 
                    type="email" 
                    value={newVU.email_zentrale}
                    onChange={(e) => handleVuChange('email_zentrale', e.target.value)}
                    placeholder="info@gesellschaft.de"
                    data-testid="vu-email-zentrale-input"
                  />
                </div>

                <div className="form-group">
                  <label>E-Mail Schaden</label>
                  <input 
                    type="email" 
                    value={newVU.email_schaden}
                    onChange={(e) => handleVuChange('email_schaden', e.target.value)}
                    placeholder="schaden@gesellschaft.de"
                    data-testid="vu-email-schaden-input"
                  />
                </div>

                <div className="form-group">
                  <label>Ansprechpartner</label>
                  <input 
                    type="text" 
                    value={newVU.ansprechpartner}
                    onChange={(e) => handleVuChange('ansprechpartner', e.target.value)}
                    placeholder="Name des Ansprechpartners"
                    data-testid="vu-ansprechpartner-input"
                  />
                </div>

                <div className="form-group">
                  <label>Vermittlernummer</label>
                  <input 
                    type="text" 
                    value={newVU.acencia_vermittlernummer}
                    onChange={(e) => handleVuChange('acencia_vermittlernummer', e.target.value)}
                    placeholder="Acencia Vermittlernummer"
                    data-testid="vu-vermittler-input"
                  />
                </div>

                <div className="form-group">
                  <label>VU-ID</label>
                  <input 
                    type="text" 
                    value={newVU.vu_id}
                    onChange={(e) => handleVuChange('vu_id', e.target.value)}
                    placeholder="Eindeutige VU-ID"
                    data-testid="vu-id-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Bemerkung</label>
                  <textarea 
                    value={newVU.bemerkung}
                    onChange={(e) => handleVuChange('bemerkung', e.target.value)}
                    placeholder="Zusätzliche Bemerkungen"
                    data-testid="vu-bemerkung-input"
                  />
                </div>
              </div>
              
              <div className="form-bottom">
                <div></div>
                <div className="form-buttons">
                  <button 
                    className="btn" 
                    onClick={createVU}
                    disabled={!newVU.name}
                    data-testid="create-vu-btn"
                  >
                    Erstellen
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => setVuFormVisible(false)}
                    data-testid="cancel-vu-btn"
                  >
                    Abbrechen
                  </button>
                </div>
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