import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Euro, TrendingUp, PieChart, Download, FileText, Mail, 
  Calendar, Clock, Users, Calculator, FileDown, Send,
  CheckCircle, AlertCircle, BarChart3, DollarSign,
  ClipboardCheck, MessageSquare, CalendarDays, Briefcase
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import config from '../config';

// ==================== PROVISIONSABRECHNUNG ====================
export const Provisionsabrechnung = () => {
  const [provisions, setProvisions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  useEffect(() => {
    fetchProvisions();
  }, [year]);

  const fetchProvisions = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/provisionen/summary?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Provisionsabrechnung</h2>
        <p className="text-muted-foreground">Übersicht Ihrer Provisionen und Courtagen</p>
      </div>

      <div className="flex gap-2">
        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2023, 2024, 2025].map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Jahresgesamt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.yearly_total)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Abschlussprovisionen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Object.values(summary.monthly).reduce((sum, m) => sum + m.abschlussprovision, 0))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bestandsprovisionen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Object.values(summary.monthly).reduce((sum, m) => sum + m.bestandsprovision, 0))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Storno-Risiko</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.storno_risk)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monatliche Übersicht {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(summary.monthly).map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{month}</span>
                    <div className="flex gap-4">
                      <Badge variant="outline">{data.count} Abrechnungen</Badge>
                      <span className="font-bold">{formatCurrency(data.gesamt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// ==================== EMAIL TEMPLATES ====================
export const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'info'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/email/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${config.API_BASE_URL}/email/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast({ title: "Template erstellt" });
        setShowForm(false);
        fetchTemplates();
      }
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">E-Mail Vorlagen</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihre E-Mail Templates</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Mail className="mr-2 h-4 w-4" />
          Neue Vorlage
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neue E-Mail Vorlage</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Betreff</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Verwenden Sie {variablen} für Platzhalter"
                  required
                />
              </div>
              <div>
                <Label>Inhalt</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                  rows={8}
                  placeholder="E-Mail Inhalt mit {variablen}"
                  required
                />
              </div>
              <div>
                <Label>Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({...formData, category: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="reminder">Erinnerung</SelectItem>
                    <SelectItem value="contract">Vertrag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Speichern</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.subject}</CardDescription>
                </div>
                <Badge>{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {template.body.substring(0, 200)}...
              </p>
              {template.variables && template.variables.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {template.variables.map(v => (
                    <Badge key={v} variant="outline">{`{${v}}`}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== BERATUNGSPROTOKOLLE ====================
export const Beratungsprotokolle = () => {
  const [protokolle, setProtokolle] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProtokolle();
  }, []);

  const fetchProtokolle = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/beratungsprotokolle`);
      if (response.ok) {
        const data = await response.json();
        setProtokolle(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Beratungsprotokolle</h2>
          <p className="text-muted-foreground">IDD-konforme Dokumentation</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Neues Protokoll
        </Button>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Alle Beratungen werden gemäß IDD-Richtlinien dokumentiert mit Bedarfsanalyse, 
          Geeignetheitsprüfung und Risikohinweisen.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {protokolle.map(protokoll => (
          <Card key={protokoll.id}>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="text-lg">
                  Beratung vom {new Date(protokoll.datum).toLocaleDateString('de-DE')}
                </CardTitle>
                <Badge>{protokoll.typ}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Anlass:</span> {protokoll.anlass}
                </div>
                <div className="flex gap-2">
                  {protokoll.bedarfsanalyse_durchgefuehrt && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Bedarfsanalyse
                    </Badge>
                  )}
                  {protokoll.geeignetheitspruefung && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Geeignetheitsprüfung
                    </Badge>
                  )}
                  {protokoll.produktinformationen_ausgehaendigt && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Produktinfos
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== TERMINKALENDER ====================
export const Terminkalender = () => {
  const [termine, setTermine] = useState([]);
  const [wiedervorlagen, setWiedervorlagen] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTermine();
    fetchWiedervorlagen();
  }, []);

  const fetchTermine = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/termine`);
      if (response.ok) {
        const data = await response.json();
        setTermine(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchWiedervorlagen = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/termine/wiedervorlagen`);
      if (response.ok) {
        const data = await response.json();
        setWiedervorlagen(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Terminverwaltung</h2>
        <p className="text-muted-foreground">Termine und Wiedervorlagen</p>
      </div>

      <Tabs defaultValue="termine">
        <TabsList>
          <TabsTrigger value="termine">Termine</TabsTrigger>
          <TabsTrigger value="wiedervorlagen">Wiedervorlagen ({wiedervorlagen.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="termine">
          <Card>
            <CardHeader>
              <CardTitle>Anstehende Termine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {termine.map(termin => (
                  <div key={termin.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="font-medium">{termin.titel}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(termin.start).toLocaleString('de-DE')}
                      </div>
                    </div>
                    <Badge>{termin.typ}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wiedervorlagen">
          <Card>
            <CardHeader>
              <CardTitle>Offene Wiedervorlagen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wiedervorlagen.map(wv => (
                  <div key={wv.id} className="p-4 border rounded">
                    <div className="font-medium">{wv.titel}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Grund: {wv.wiedervorlage_grund}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Fällig: {new Date(wv.start).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ==================== TARIFVERGLEICH ====================
export const Tarifvergleich = () => {
  const [sparte, setSparte] = useState('');
  const [results, setResults] = useState(null);
  const { toast } = useToast();

  const handleCalculate = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/tarifvergleich/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sparte,
          parameter: {} // Would include actual parameters
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Tarifvergleich</h2>
        <p className="text-muted-foreground">Vergleichen Sie Versicherungstarife</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vergleichsparameter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Sparte</Label>
              <Select value={sparte} onValueChange={setSparte}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie eine Sparte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kfz">KFZ</SelectItem>
                  <SelectItem value="haftpflicht">Haftpflicht</SelectItem>
                  <SelectItem value="hausrat">Hausrat</SelectItem>
                  <SelectItem value="rechtsschutz">Rechtsschutz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCalculate}>
              <Calculator className="mr-2 h-4 w-4" />
              Vergleich starten
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Vergleichsergebnisse</CardTitle>
            <CardDescription>{results.empfehlung}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.tarife.map((tarif, idx) => (
                <div key={idx} className="p-4 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{tarif.tarif_name}</div>
                      <div className="text-sm text-muted-foreground">{tarif.vu_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(tarif.jahresbeitrag)}
                      </div>
                      <Badge variant="outline">Score: {tarif.score}/100</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ==================== EXPORT CENTER ====================
export const ExportCenter = () => {
  const { toast } = useToast();

  const handleExport = async (type) => {
    try {
      let url = '';
      switch(type) {
        case 'kunden-csv':
          url = `${config.API_BASE_URL}/export/kunden/csv`;
          break;
        case 'vertraege-excel':
          url = `${config.API_BASE_URL}/export/vertraege/excel`;
          break;
        case 'monthly-report':
          url = `${config.API_BASE_URL}/export/report/monthly`;
          break;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        if (data.content) {
          // Download file
          const link = document.createElement('a');
          link.href = `data:${data.mime_type};base64,${data.content}`;
          link.download = data.filename;
          link.click();
          
          toast({ title: "Export erfolgreich" });
        }
      }
    } catch (error) {
      toast({ title: "Export fehlgeschlagen", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Export Center</h2>
        <p className="text-muted-foreground">Exportieren Sie Ihre Daten</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kundendaten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => handleExport('kunden-csv')}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Als CSV exportieren
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Verträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => handleExport('vertraege-excel')}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Als Excel exportieren
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monatsreport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => handleExport('monthly-report')}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Report generieren
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              GDV-Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              <FileDown className="mr-2 h-4 w-4" />
              Demnächst verfügbar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};