import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Clock, RefreshCw, Send, Calendar, AlertTriangle,
  CheckCircle, XCircle, Mail, FileText, User,
  TrendingUp, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import config from '../config';

const ContractRenewal = () => {
  const [renewals, setRenewals] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(90);
  const { toast } = useToast();

  useEffect(() => {
    fetchRenewals();
    fetchReminders();
  }, [selectedDays]);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.API_BASE_URL}/vertraege/renewals/upcoming?days_ahead=${selectedDays}`
      );
      if (response.ok) {
        const data = await response.json();
        setRenewals(data);
      }
    } catch (error) {
      console.error('Error fetching renewals:', error);
      toast({
        title: "Fehler",
        description: "Verlängerungsdaten konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/reminders/schedule`);
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const sendReminder = async (vertragId, reminderType = 'renewal') => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/vertraege/${vertragId}/send-reminder`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reminder_type: reminderType })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Erinnerung gesendet",
          description: data.message,
        });
        fetchRenewals();
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Fehler",
        description: "Erinnerung konnte nicht gesendet werden",
        variant: "destructive",
      });
    }
  };

  const autoRenewContract = async (vertragId, years = 1) => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/vertraege/${vertragId}/auto-renew`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extend_years: years })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Vertrag verlängert",
          description: data.message,
        });
        fetchRenewals();
      }
    } catch (error) {
      console.error('Error renewing contract:', error);
      toast({
        title: "Fehler",
        description: "Vertrag konnte nicht verlängert werden",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'hoch':
        return 'text-red-600 bg-red-50';
      case 'mittel':
        return 'text-yellow-600 bg-yellow-50';
      case 'niedrig':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDaysColor = (days) => {
    if (days <= 14) return 'text-red-600';
    if (days <= 30) return 'text-orange-600';
    if (days <= 60) return 'text-yellow-600';
    return 'text-green-600';
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vertragsverlängerungen</h2>
        <p className="text-muted-foreground">
          Verwalten Sie auslaufende Verträge und Verlängerungen
        </p>
      </div>

      {/* Summary Cards */}
      {renewals && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kritisch (30 Tage)</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {renewals.summary.next_30_days}
              </div>
              <p className="text-xs text-muted-foreground">
                Dringender Handlungsbedarf
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnung (60 Tage)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {renewals.summary.next_60_days}
              </div>
              <p className="text-xs text-muted-foreground">
                Bald Handlungsbedarf
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Info (90 Tage)</CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {renewals.summary.next_90_days}
              </div>
              <p className="text-xs text-muted-foreground">
                Zur Planung
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Zeitraum</CardTitle>
          <CardDescription>Wählen Sie den Vorschau-Zeitraum</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={selectedDays === 30 ? 'default' : 'outline'}
              onClick={() => setSelectedDays(30)}
            >
              30 Tage
            </Button>
            <Button
              variant={selectedDays === 60 ? 'default' : 'outline'}
              onClick={() => setSelectedDays(60)}
            >
              60 Tage
            </Button>
            <Button
              variant={selectedDays === 90 ? 'default' : 'outline'}
              onClick={() => setSelectedDays(90)}
            >
              90 Tage
            </Button>
            <Button
              variant={selectedDays === 180 ? 'default' : 'outline'}
              onClick={() => setSelectedDays(180)}
            >
              180 Tage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="renewals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="renewals">Auslaufende Verträge</TabsTrigger>
          <TabsTrigger value="reminders">Geplante Erinnerungen</TabsTrigger>
          <TabsTrigger value="actions">Schnellaktionen</TabsTrigger>
        </TabsList>

        <TabsContent value="renewals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Auslaufende Verträge ({renewals?.total || 0})
              </CardTitle>
              <CardDescription>
                Verträge die in den nächsten {selectedDays} Tagen auslaufen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {renewals?.renewals.map((renewal) => (
                  <div
                    key={renewal.vertrag.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-semibold">
                            {renewal.vertrag.vertragsnummer}
                          </span>
                          <Badge className={getPriorityColor(renewal.prioritaet)}>
                            Priorität: {renewal.prioritaet}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <User className="inline h-3 w-3 mr-1" />
                            <span className="text-muted-foreground">Kunde:</span>{' '}
                            {renewal.kunde ? (
                              <span className="font-medium">
                                {renewal.kunde.vorname} {renewal.kunde.name}
                              </span>
                            ) : (
                              <span>Unbekannt</span>
                            )}
                          </div>
                          <div>
                            <Calendar className="inline h-3 w-3 mr-1" />
                            <span className="text-muted-foreground">Ablauf:</span>{' '}
                            <span className={`font-medium ${getDaysColor(renewal.tage_bis_ablauf)}`}>
                              {formatDate(renewal.ablaufdatum)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gesellschaft:</span>{' '}
                            <span className="font-medium">
                              {renewal.vertrag.gesellschaft}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Beitrag:</span>{' '}
                            <span className="font-medium">
                              {formatCurrency(renewal.vertrag.beitrag_brutto)}
                            </span>
                          </div>
                        </div>
                        
                        <Alert className="mt-2">
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{renewal.tage_bis_ablauf} Tage</strong> bis zum Ablauf
                            • {renewal.empfohlene_aktion}
                          </AlertDescription>
                        </Alert>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => sendReminder(renewal.vertrag.id, 'renewal')}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Erinnerung
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => autoRenewContract(renewal.vertrag.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Verlängern
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendReminder(renewal.vertrag.id, 'cancellation')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Kündigung
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!renewals?.renewals || renewals.renewals.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    Keine auslaufenden Verträge in diesem Zeitraum
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geplante Erinnerungen</CardTitle>
              <CardDescription>
                Heute anstehende automatische Erinnerungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reminders.map((reminder, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="font-medium">{reminder.reminder_type}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Vertrag: {reminder.vertragsnummer} • 
                        Kunde: {reminder.kunde_name} • 
                        Ablauf in {reminder.days_until} Tagen
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendReminder(reminder.vertrag_id, 'scheduled')}>
                      <Send className="h-4 w-4 mr-1" />
                      Jetzt senden
                    </Button>
                  </div>
                ))}
                
                {reminders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Erinnerungen für heute geplant
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
              <CardDescription>
                Massenaktionen für Vertragsverlängerungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Automatische Prozesse</AlertTitle>
                  <AlertDescription>
                    Diese Aktionen können für mehrere Verträge gleichzeitig ausgeführt werden.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  <Button className="justify-start" size="lg">
                    <Mail className="h-5 w-5 mr-2" />
                    Alle Erinnerungen (30 Tage) versenden
                    <ChevronRight className="h-5 w-5 ml-auto" />
                  </Button>
                  
                  <Button className="justify-start" size="lg" variant="outline">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Alle Standard-Verträge automatisch verlängern
                    <ChevronRight className="h-5 w-5 ml-auto" />
                  </Button>
                  
                  <Button className="justify-start" size="lg" variant="outline">
                    <FileText className="h-5 w-5 mr-2" />
                    Verlängerungsangebote generieren
                    <ChevronRight className="h-5 w-5 ml-auto" />
                  </Button>
                  
                  <Button className="justify-start" size="lg" variant="outline">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Prämienanpassungen berechnen
                    <ChevronRight className="h-5 w-5 ml-auto" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractRenewal;