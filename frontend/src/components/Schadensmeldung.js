import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  FileText, Plus, Edit, Trash2, Search, Filter, 
  AlertCircle, CheckCircle, Clock, FileUp, Camera,
  DollarSign, Calendar, User, Building2, MapPin,
  Phone, Mail, Info, TrendingUp, AlertTriangle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import config from '../config';

const Schadensmeldung = () => {
  const [schadensmeldungen, setSchadensmeldungen] = useState([]);
  const [filteredSchaeden, setFilteredSchaeden] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchaden, setEditingSchaden] = useState(null);
  const [kunden, setKunden] = useState([]);
  const [vertraege, setVertraege] = useState([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    kunde_id: '',
    vertrag_id: '',
    schadendatum: '',
    schadentyp: '',
    schadenort: '',
    schadenbeschreibung: '',
    schadenverursacher: '',
    zeugen: '',
    polizei_aktenzeichen: '',
    schadenhoehe_geschaetzt: '',
    selbstbeteiligung: '',
    sachbearbeiter_intern: '',
    naechste_aktion: '',
    naechste_aktion_datum: '',
    fotos_vorhanden: false,
    interne_notizen: ''
  });

  const [filters, setFilters] = useState({
    status: '',
    schadentyp: '',
    kunde_id: ''
  });

  const schadenTypen = [
    { value: 'kfz_haftpflicht', label: 'KFZ Haftpflicht' },
    { value: 'kfz_kasko', label: 'KFZ Kasko' },
    { value: 'haftpflicht', label: 'Haftpflicht' },
    { value: 'hausrat', label: 'Hausrat' },
    { value: 'wohngebaeude', label: 'Wohngebäude' },
    { value: 'rechtsschutz', label: 'Rechtsschutz' },
    { value: 'unfall', label: 'Unfall' },
    { value: 'berufsunfaehigkeit', label: 'Berufsunfähigkeit' },
    { value: 'sonstige', label: 'Sonstige' }
  ];

  const statusOptions = [
    { value: 'gemeldet', label: 'Gemeldet', color: 'blue' },
    { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'yellow' },
    { value: 'dokumente_angefordert', label: 'Dokumente angefordert', color: 'orange' },
    { value: 'bei_vu', label: 'Bei VU', color: 'purple' },
    { value: 'reguliert', label: 'Reguliert', color: 'green' },
    { value: 'abgelehnt', label: 'Abgelehnt', color: 'red' },
    { value: 'geschlossen', label: 'Geschlossen', color: 'gray' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, schadensmeldungen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Schadensmeldungen
      const schadenRes = await fetch(`${config.API_BASE_URL}/schadensmeldungen`);
      if (schadenRes.ok) {
        const data = await schadenRes.json();
        setSchadensmeldungen(data);
      }

      // Fetch Statistics
      const statsRes = await fetch(`${config.API_BASE_URL}/schadensmeldungen/statistics`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }

      // Fetch Kunden for dropdown
      const kundenRes = await fetch(`${config.API_BASE_URL}/kunden`);
      if (kundenRes.ok) {
        const kundenData = await kundenRes.json();
        setKunden(kundenData);
      }

      // Fetch Verträge
      const vertraegeRes = await fetch(`${config.API_BASE_URL}/vertraege`);
      if (vertraegeRes.ok) {
        const vertraegeData = await vertraegeRes.json();
        setVertraege(vertraegeData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schadensmeldungen];

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    if (filters.schadentyp) {
      filtered = filtered.filter(s => s.schadentyp === filters.schadentyp);
    }
    if (filters.kunde_id) {
      filtered = filtered.filter(s => s.kunde_id === filters.kunde_id);
    }

    setFilteredSchaeden(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingSchaden 
        ? `${config.API_BASE_URL}/schadensmeldungen/${editingSchaden.id}`
        : `${config.API_BASE_URL}/schadensmeldungen`;
      
      const method = editingSchaden ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: editingSchaden 
            ? "Schadensmeldung aktualisiert" 
            : "Schadensmeldung erstellt",
        });
        setShowForm(false);
        setEditingSchaden(null);
        resetForm();
        fetchData();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Fehler",
        description: "Schadensmeldung konnte nicht gespeichert werden",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (schaden) => {
    setEditingSchaden(schaden);
    setFormData({
      ...schaden,
      schadendatum: schaden.schadendatum ? schaden.schadendatum.split('T')[0] : '',
      naechste_aktion_datum: schaden.naechste_aktion_datum ? schaden.naechste_aktion_datum.split('T')[0] : '',
      schadenhoehe_geschaetzt: schaden.schadenhoehe_geschaetzt || '',
      selbstbeteiligung: schaden.selbstbeteiligung || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Möchten Sie diese Schadensmeldung wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/schadensmeldungen/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Schadensmeldung gelöscht",
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Fehler",
        description: "Schadensmeldung konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      kunde_id: '',
      vertrag_id: '',
      schadendatum: '',
      schadentyp: '',
      schadenort: '',
      schadenbeschreibung: '',
      schadenverursacher: '',
      zeugen: '',
      polizei_aktenzeichen: '',
      schadenhoehe_geschaetzt: '',
      selbstbeteiligung: '',
      sachbearbeiter_intern: '',
      naechste_aktion: '',
      naechste_aktion_datum: '',
      fotos_vorhanden: false,
      interne_notizen: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (!statusConfig) return <Badge>{status}</Badge>;
    
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colorClasses[statusConfig.color]}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schadensmeldungen</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Schadensfälle und deren Bearbeitung
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingSchaden(null); resetForm(); }}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Schadensmeldung
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offene Fälle</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.offene_faelle}</div>
              <p className="text-xs text-muted-foreground">
                Benötigen Bearbeitung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Geschätzte Schadenhöhe</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statistics.schadenhoehe_geschaetzt_gesamt)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gesamt geschätzt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reguliert</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statistics.schadenhoehe_reguliert_gesamt)}
              </div>
              <p className="text-xs text-muted-foreground">
                Bereits reguliert
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausgezahlt</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statistics.auszahlungsbetrag_gesamt)}
              </div>
              <p className="text-xs text-muted-foreground">
                An Kunden ausgezahlt
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSchaden ? 'Schadensmeldung bearbeiten' : 'Neue Schadensmeldung'}
            </CardTitle>
            <CardDescription>
              Erfassen Sie alle relevanten Informationen zum Schadensfall
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kunde_id">Kunde *</Label>
                  <Select
                    value={formData.kunde_id}
                    onValueChange={(value) => setFormData({...formData, kunde_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kunde wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {kunden.map(kunde => (
                        <SelectItem key={kunde.id} value={kunde.id}>
                          {kunde.vorname} {kunde.name} ({kunde.kunde_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vertrag_id">Vertrag</Label>
                  <Select
                    value={formData.vertrag_id}
                    onValueChange={(value) => setFormData({...formData, vertrag_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vertrag wählen (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {vertraege
                        .filter(v => v.kunde_id === formData.kunde_id)
                        .map(vertrag => (
                          <SelectItem key={vertrag.id} value={vertrag.id}>
                            {vertrag.vertragsnummer} - {vertrag.produkt_sparte}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schadendatum">Schadendatum</Label>
                  <Input
                    type="date"
                    id="schadendatum"
                    value={formData.schadendatum}
                    onChange={(e) => setFormData({...formData, schadendatum: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schadentyp">Schadentyp</Label>
                  <Select
                    value={formData.schadentyp}
                    onValueChange={(value) => setFormData({...formData, schadentyp: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Typ wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {schadenTypen.map(typ => (
                        <SelectItem key={typ.value} value={typ.value}>
                          {typ.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schadenort">Schadenort</Label>
                  <Input
                    id="schadenort"
                    value={formData.schadenort}
                    onChange={(e) => setFormData({...formData, schadenort: e.target.value})}
                    placeholder="Ort des Schadens"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schadenverursacher">Schadenverursacher</Label>
                  <Input
                    id="schadenverursacher"
                    value={formData.schadenverursacher}
                    onChange={(e) => setFormData({...formData, schadenverursacher: e.target.value})}
                    placeholder="Name/Details des Verursachers"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="polizei_aktenzeichen">Polizei Aktenzeichen</Label>
                  <Input
                    id="polizei_aktenzeichen"
                    value={formData.polizei_aktenzeichen}
                    onChange={(e) => setFormData({...formData, polizei_aktenzeichen: e.target.value})}
                    placeholder="Falls vorhanden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schadenhoehe_geschaetzt">Geschätzte Schadenhöhe (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    id="schadenhoehe_geschaetzt"
                    value={formData.schadenhoehe_geschaetzt}
                    onChange={(e) => setFormData({...formData, schadenhoehe_geschaetzt: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selbstbeteiligung">Selbstbeteiligung (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    id="selbstbeteiligung"
                    value={formData.selbstbeteiligung}
                    onChange={(e) => setFormData({...formData, selbstbeteiligung: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sachbearbeiter_intern">Interner Sachbearbeiter</Label>
                  <Input
                    id="sachbearbeiter_intern"
                    value={formData.sachbearbeiter_intern}
                    onChange={(e) => setFormData({...formData, sachbearbeiter_intern: e.target.value})}
                    placeholder="Name des Bearbeiters"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schadenbeschreibung">Schadenbeschreibung</Label>
                <Textarea
                  id="schadenbeschreibung"
                  value={formData.schadenbeschreibung}
                  onChange={(e) => setFormData({...formData, schadenbeschreibung: e.target.value})}
                  placeholder="Detaillierte Beschreibung des Schadens..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zeugen">Zeugen</Label>
                <Textarea
                  id="zeugen"
                  value={formData.zeugen}
                  onChange={(e) => setFormData({...formData, zeugen: e.target.value})}
                  placeholder="Namen und Kontaktdaten von Zeugen..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="naechste_aktion">Nächste Aktion</Label>
                  <Input
                    id="naechste_aktion"
                    value={formData.naechste_aktion}
                    onChange={(e) => setFormData({...formData, naechste_aktion: e.target.value})}
                    placeholder="Was ist als nächstes zu tun?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="naechste_aktion_datum">Wiedervorlage am</Label>
                  <Input
                    type="date"
                    id="naechste_aktion_datum"
                    value={formData.naechste_aktion_datum}
                    onChange={(e) => setFormData({...formData, naechste_aktion_datum: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fotos_vorhanden"
                  checked={formData.fotos_vorhanden}
                  onChange={(e) => setFormData({...formData, fotos_vorhanden: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="fotos_vorhanden">Fotos vorhanden</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interne_notizen">Interne Notizen</Label>
                <Textarea
                  id="interne_notizen"
                  value={formData.interne_notizen}
                  onChange={(e) => setFormData({...formData, interne_notizen: e.target.value})}
                  placeholder="Notizen für interne Zwecke..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSchaden(null);
                    resetForm();
                  }}
                >
                  Abbrechen
                </Button>
                <Button type="submit">
                  {editingSchaden ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Status</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.schadentyp}
              onValueChange={(value) => setFilters({...filters, schadentyp: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Typen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Typen</SelectItem>
                {schadenTypen.map(typ => (
                  <SelectItem key={typ.value} value={typ.value}>
                    {typ.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.kunde_id}
              onValueChange={(value) => setFilters({...filters, kunde_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Kunden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Kunden</SelectItem>
                {kunden.map(kunde => (
                  <SelectItem key={kunde.id} value={kunde.id}>
                    {kunde.vorname} {kunde.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schadensmeldungen List */}
      <Card>
        <CardHeader>
          <CardTitle>Schadensfälle ({filteredSchaeden.length})</CardTitle>
          <CardDescription>
            Übersicht aller gemeldeten Schäden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSchaeden.map(schaden => {
              const kunde = kunden.find(k => k.id === schaden.kunde_id);
              const vertrag = vertraege.find(v => v.id === schaden.vertrag_id);
              
              return (
                <div key={schaden.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {schaden.schadennummer || 'Ohne Nummer'}
                        </h3>
                        {getStatusBadge(schaden.status)}
                        {schaden.schadentyp && (
                          <Badge variant="outline">
                            {schadenTypen.find(t => t.value === schaden.schadentyp)?.label || schaden.schadentyp}
                          </Badge>
                        )}
                        {schaden.fotos_vorhanden && (
                          <Badge variant="secondary">
                            <Camera className="h-3 w-3 mr-1" />
                            Fotos
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Kunde:</span>{' '}
                          <span className="font-medium">
                            {kunde ? `${kunde.vorname} ${kunde.name}` : 'Unbekannt'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Schadendatum:</span>{' '}
                          <span className="font-medium">{formatDate(schaden.schadendatum)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Geschätzt:</span>{' '}
                          <span className="font-medium">{formatCurrency(schaden.schadenhoehe_geschaetzt)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reguliert:</span>{' '}
                          <span className="font-medium">{formatCurrency(schaden.schadenhoehe_reguliert)}</span>
                        </div>
                      </div>
                      
                      {schaden.schadenbeschreibung && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {schaden.schadenbeschreibung}
                        </p>
                      )}
                      
                      {schaden.naechste_aktion && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Nächste Aktion:</strong> {schaden.naechste_aktion}
                            {schaden.naechste_aktion_datum && (
                              <span className="ml-2">
                                (bis {formatDate(schaden.naechste_aktion_datum)})
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(schaden)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(schaden.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredSchaeden.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Keine Schadensmeldungen gefunden
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schadensmeldung;