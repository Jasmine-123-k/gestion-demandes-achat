const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

let demandes = [];
let nextId = 1;

// Routes API
app.get('/api/demandes', (req, res) => {
    res.json(demandes);
});

app.post('/api/demandes', (req, res) => {
    const { filiale, description, montant, urgence, demandeur } = req.body;
    
    const newDA = {
        id: nextId++,
        filiale,
        description,
        montant,
        urgence,
        demandeur,
        dateCreation: new Date().toLocaleDateString('fr-FR'),
        statut: 'En attente',
        approvals: {
            acheteur: { approuve: true, date: new Date().toLocaleDateString('fr-FR'), nom: demandeur },
            dg: { approuve: null, date: null, nom: 'Mr ISSOUF BAMBA' },
            compta: { approuve: null, date: null, nom: 'Comptabilité' }
        }
    };
    
    demandes.unshift(newDA);
    res.json(newDA);
});

app.put('/api/demandes/:id/approve', (req, res) => {
    const { role } = req.body;
    const da = demandes.find(d => d.id === parseInt(req.params.id));
    
    if (!da) {
        return res.status(404).json({ error: 'DA non trouvée' });
    }
    
    if (role === 'dg') {
        da.approvals.dg.approuve = true;
        da.approvals.dg.date = new Date().toLocaleDateString('fr-FR');
        da.statut = 'Approuvée - En attente Compta';
    } else if (role === 'compta') {
        da.approvals.compta.approuve = true;
        da.approvals.compta.date = new Date().toLocaleDateString('fr-FR');
        da.statut = 'Validée';
    }
    
    res.json(da);
});

app.put('/api/demandes/:id/reject', (req, res) => {
    const { role } = req.body;
    const da = demandes.find(d => d.id === parseInt(req.params.id));
    
    if (!da) {
        return res.status(404).json({ error: 'DA non trouvée' });
    }
    
    da.statut = 'Rejetée';
    if (role === 'dg') {
        da.approvals.dg.approuve = false;
        da.approvals.dg.date = new Date().toLocaleDateString('fr-FR');
    }
    
    res.json(da);
});

app.delete('/api/demandes/:id', (req, res) => {
    demandes = demandes.filter(d => d.id !== parseInt(req.params.id));
    res.json({ success: true });
});

// Répondre avec l'HTML pour toute autre route
app.get('*', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Demandes d'Achat</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
        .header { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .header-top h1 { font-size: 24px; font-weight: 600; }
        .header-top p { font-size: 13px; color: #666; margin-top: 0.25rem; }
        .user-info { display: flex; gap: 1rem; align-items: center; }
        .avatar { width: 48px; height: 48px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; }
        .user-details { text-align: right; }
        .user-details div:first-child { font-weight: 500; font-size: 14px; }
        .user-details div:last-child { font-size: 12px; color: #666; }
        .notification-badge { background: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; text-align: center; }
        .stat-label { font-size: 12px; color: #666; margin-bottom: 0.5rem; }
        .stat-value { font-size: 28px; font-weight: 600; color: #2563eb; }
        .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
        .tab { padding: 0.75rem 1.5rem; background: transparent; border: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab:hover { color: #333; }
        .tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        .content { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 0.35rem; color: #333; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; font-family: inherit; }
        .form-group textarea { min-height: 80px; resize: vertical; }
        .btn { padding: 0.6rem 1.2rem; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn:hover { background: #1d4ed8; }
        .btn-secondary { background: #f3f4f6; color: #333; border: 1px solid #e5e7eb; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 1rem; }
        .table th { background: #f3f4f6; padding: 0.75rem; text-align: left; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
        .table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
        .status { display: inline-block; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.approved { background: #d1fae5; color: #065f46; }
        .login-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .login-box { background: white; border-radius: 12px; padding: 2.5rem; max-width: 400px; width: 90%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        .login-box h1 { font-size: 24px; margin-bottom: 0.5rem; text-align: center; }
        .login-box p { text-align: center; color: #666; font-size: 13px; margin-bottom: 2rem; }
        .login-info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin-top: 1.5rem; font-size: 12px; color: #1e40af; }
        .notification { position: fixed; top: 20px; right: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem 1.5rem; max-width: 400px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 2000; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    </style>
</head>
<body>
    <div id="app"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js"></script>
    <script>
        const API_URL = window.location.origin;
        const app = {
            state: { currentUser: null, currentRole: null, users: { 'jasmine': { password: 'jasmine123', name: 'Jasmine Koui', role: 'acheteur' }, 'cheick': { password: 'cheick123', name: 'Cheick Cissé', role: 'acheteur' }, 'issouf': { password: 'issouf123', name: 'Mr Issouf Bamba', role: 'dg' }, 'compta': { password: 'compta123', name: 'Comptabilité', role: 'compta' } }, demandes: [], notifications: [], currentTab: 'demandes' },
            async init() { if (!this.state.currentUser) { this.renderLogin(); } else { await this.loadDemandes(); this.render(); setInterval(() => this.loadDemandes(), 3000); } },
            login(username, password) { const user = this.state.users[username.toLowerCase()]; if (user && user.password === password) { this.state.currentUser = user.name; this.state.currentRole = user.role; this.notify('Bienvenue ' + user.name + '!', 'success'); this.init(); } else { this.notify('Identifiants invalides', 'error'); } },
            logout() { this.state.currentUser = null; this.state.currentRole = null; this.init(); },
            notify(message, type = 'info') { const id = Date.now(); this.state.notifications.push({ id, message, type }); setTimeout(() => { this.state.notifications = this.state.notifications.filter(n => n.id !== id); this.render(); }, 4000); },
            async loadDemandes() { try { const response = await fetch(API_URL + '/api/demandes'); this.state.demandes = await response.json(); } catch (error) { console.error('Erreur:', error); } },
            async createDA(data) { try { const response = await fetch(API_URL + '/api/demandes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, demandeur: this.state.currentUser }) }); const newDA = await response.json(); this.notify('DA #' + newDA.id + ' créée!', 'success'); await this.loadDemandes(); this.state.currentTab = 'demandes'; this.render(); } catch (error) { this.notify('Erreur', 'error'); } },
            async approveDA(id) { try { await fetch(API_URL + '/api/demandes/' + id + '/approve', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: this.state.currentRole }) }); this.notify('DA #' + id + ' approuvée!', 'success'); await this.loadDemandes(); this.render(); } catch (error) { this.notify('Erreur', 'error'); } },
            async rejectDA(id) { try { await fetch(API_URL + '/api/demandes/' + id + '/reject', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: this.state.currentRole }) }); this.notify('DA #' + id + ' rejetée', 'error'); await this.loadDemandes(); this.render(); } catch (error) { this.notify('Erreur', 'error'); } },
            getDAsToApprove() { if (this.state.currentRole === 'dg') { return this.state.demandes.filter(d => d.approvals.acheteur.approuve && !d.approvals.dg.approuve && d.statut === 'En attente'); } else if (this.state.currentRole === 'compta') { return this.state.demandes.filter(d => d.approvals.dg.approuve && !d.approvals.compta.approuve && d.statut === 'Approuvée - En attente Compta'); } return []; },
            renderLogin() { const html = '<div class="login-container"><div class="login-box"><h1>Gestion des Demandes d\\'Achat</h1><p>Système centralisé en temps réel</p><form id="loginForm" onsubmit="app.handleLogin(event)"><div class="form-group"><label>Identifiant</label><input type="text" id="username" placeholder="jasmine, cheick, issouf, compta" required autofocus></div><div class="form-group"><label>Mot de passe</label><input type="password" id="password" placeholder="••••••••" required></div><button type="submit" class="btn" style="width: 100%; justify-content: center;">Se connecter</button></form><div class="login-info"><strong>Comptes de test:</strong><br>jasmine (Acheteur)<br>cheick (Acheteur)<br>issouf (DG)<br>compta (Comptabilité)<br><br><strong>Tous mots de passe:</strong> [identifiant]123</div></div></div>'; document.getElementById('app').innerHTML = html; },
            handleLogin(e) { e.preventDefault(); const username = document.getElementById('username').value; const password = document.getElementById('password').value; this.login(username, password); },
            render() { const daToApprove = this.getDAsToApprove(); const demandes = this.state.demandes.filter(d => d.statut !== 'Validée' && d.statut !== 'Rejetée'); const html = '<div class="container"><div class="header"><div class="header-top"><div><h1>Gestion des Demandes d\\'Achat</h1><p>Système centralisé en temps réel ☁️</p></div><div class="user-info"><div class="avatar">' + this.state.currentUser.charAt(0).toUpperCase() + '</div><div class="user-details"><div>' + this.state.currentUser + '</div><div>' + (this.state.currentRole === 'dg' ? 'Direction Générale' : this.state.currentRole === 'acheteur' ? 'Acheteur' : 'Comptabilité') + '</div></div>' + (daToApprove.length > 0 ? '<div class="notification-badge">' + daToApprove.length + '</div>' : '') + '<button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 12px;" onclick="app.logout()">Déconnexion</button></div></div><div class="stats-grid"><div class="stat-card"><div class="stat-label">Demandes totales</div><div class="stat-value">' + this.state.demandes.length + '</div></div><div class="stat-card"><div class="stat-label">En attente</div><div class="stat-value">' + this.state.demandes.filter(d => d.statut === 'En attente').length + '</div></div><div class="stat-card"><div class="stat-label">Approuvées</div><div class="stat-value">' + this.state.demandes.filter(d => d.statut === 'Approuvée - En attente Compta').length + '</div></div><div class="stat-card"><div class="stat-label">Validées</div><div class="stat-value">' + this.state.demandes.filter(d => d.statut === 'Validée').length + '</div></div></div></div><div class="tabs"><button class="tab' + (this.state.currentTab === 'demandes' ? ' active' : '') + '" onclick="app.switchTab(\\'demandes\\')">Toutes les demandes</button>' + ((this.state.currentRole === 'dg' || this.state.currentRole === 'compta') && daToApprove.length > 0 ? '<button class="tab' + (this.state.currentTab === 'validation' ? ' active' : '') + '" onclick="app.switchTab(\\'validation\\')">À valider <span style="background: #ef4444; color: white; border-radius: 12px; padding: 0.15rem 0.5rem; font-size: 11px; font-weight: 600; margin-left: 0.5rem;">' + daToApprove.length + '</span></button>' : '') + '<button class="tab' + (this.state.currentTab === 'creer' ? ' active' : '') + '" onclick="app.switchTab(\\'creer\\')">Créer une DA</button><button class="tab' + (this.state.currentTab === 'archive' ? ' active' : '') + '" onclick="app.switchTab(\\'archive\\')">Archive</button></div><div class="content">' + (this.state.currentTab === 'demandes' ? (demandes.length === 0 ? '<div style="text-align: center; padding: 2rem; color: #999;">📋 Aucune demande en cours</div>' : '<button class="btn" onclick="app.exportExcel()">📊 Exporter Excel</button><table class="table"><thead><tr><th>ID</th><th>Filiale</th><th>Montant</th><th>Urgence</th><th>Statut</th><th>Demandeur</th><th>Actions</th></tr></thead><tbody>' + demandes.map(da => '<tr><td><strong>#' + da.id + '</strong></td><td>' + da.filiale + '</td><td>' + Number(da.montant).toLocaleString('fr-FR') + ' XOF</td><td>' + da.urgence + '</td><td><span class="status ' + (da.statut.includes('attente') ? 'pending' : 'approved') + '">' + da.statut + '</span></td><td>' + da.demandeur + '</td><td><button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 12px;" onclick="app.showDetails(' + da.id + ')">Détails</button>' + ((this.state.currentRole === 'dg' && da.approvals.acheteur.approuve && !da.approvals.dg.approuve) || (this.state.currentRole === 'compta' && da.approvals.dg.approuve && !da.approvals.compta.approuve) ? '<button class="btn" style="padding: 0.35rem 0.75rem; font-size: 12px; background: #10b981;" onclick="app.approveDA(' + da.id + ')">✓ Approuver</button><button class="btn" style="padding: 0.35rem 0.75rem; font-size: 12px; background: #ef4444;" onclick="app.rejectDA(' + da.id + ')">✗ Rejeter</button>' : '') + '</td></tr>').join('') + '</tbody></table>') : this.state.currentTab === 'creer' ? '<form id="formDA" onsubmit="app.handleCreateDA(event)" style="max-width: 800px;"><div class="form-group"><label>Filiale *</label><select name="filiale" required><option value="">Sélectionner</option><option>PC PLUS GROUP</option><option>SINO AFRIC</option><option>SN PC PLUS</option><option>XCOBAT</option><option>PC PLUS TECHNOLOGIE</option><option>AGRIMOTORS</option></select></div><div class="form-group"><label>Description *</label><textarea name="description" placeholder="Détails de la demande" required></textarea></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;"><div class="form-group"><label>Montant (XOF) *</label><input type="number" name="montant" placeholder="0" required></div><div class="form-group"><label>Urgence *</label><select name="urgence" required><option value="">Sélectionner</option><option>Normal</option><option>Urgent</option><option>Très urgent</option></select></div></div><button type="submit" class="btn">Créer la demande</button></form>' : this.state.currentTab === 'validation' ? (daToApprove.length === 0 ? '<div style="text-align: center; padding: 2rem; color: #999;">✓ Aucune demande à valider</div>' : '<table class="table"><thead><tr><th>ID</th><th>Filiale</th><th>Montant</th><th>Urgence</th><th>Actions</th></tr></thead><tbody>' + daToApprove.map(da => '<tr><td><strong>#' + da.id + '</strong></td><td>' + da.filiale + '</td><td><strong>' + Number(da.montant).toLocaleString('fr-FR') + ' XOF</strong></td><td>' + da.urgence + '</td><td><button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 12px;" onclick="app.showDetails(' + da.id + ')">Détails</button><button class="btn" style="padding: 0.35rem 0.75rem; font-size: 12px; background: #10b981;" onclick="app.approveDA(' + da.id + ')">✓ Approuver</button><button class="btn" style="padding: 0.35rem 0.75rem; font-size: 12px; background: #ef4444;" onclick="app.rejectDA(' + da.id + ')">✗ Rejeter</button></td></tr>').join('') + '</tbody></table>') : '<div style="text-align: center; padding: 2rem; color: #999;">📦 Archive vide</div>') + '</div>' + this.state.notifications.map(n => '<div class="notification" style="border-left: 4px solid ' + (n.type === 'success' ? '#10b981' : n.type === 'error' ? '#ef4444' : '#2563eb') + ';"><div>' + n.message + '</div></div>').join('') + '</div>'; document.getElementById('app').innerHTML = html; },
            switchTab(tab) { this.state.currentTab = tab; this.render(); },
            handleCreateDA(e) { e.preventDefault(); const form = e.target; const data = { filiale: form.filiale.value, description: form.description.value, montant: form.montant.value, urgence: form.urgence.value }; this.createDA(data); form.reset(); },
            showDetails(id) { const da = this.state.demandes.find(d => d.id === id); if (!da) return; alert('DA #' + da.id + '\\n\\nFiliale: ' + da.filiale + '\\nMontant: ' + Number(da.montant).toLocaleString('fr-FR') + ' XOF\\nUrgence: ' + da.urgence + '\\nStatut: ' + da.statut + '\\n\\nDescription:\\n' + da.description); },
            exportExcel() { const data = this.state.demandes.map(da => ({ 'ID': da.id, 'Filiale': da.filiale, 'Montant (XOF)': da.montant, 'Urgence': da.urgence, 'Statut': da.statut, 'Demandeur': da.demandeur, 'Date': da.dateCreation })); const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'DA'); XLSX.writeFile(wb, 'DA_Export_' + new Date().toISOString().split('T')[0] + '.xlsx'); this.notify('Excel exporté', 'success'); }
        };
        app.init();
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`Serveur lancé sur le port \${PORT}\`);
});
