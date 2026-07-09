let demandes = [];
let nextId = 1;

const getHTML = () => `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Demandes d'Achat</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js"><\/script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
        .header { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .header-top h1 { font-size: 24px; font-weight: 600; }
        .avatar { width: 48px; height: 48px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; }
        .user-details { text-align: right; }
        .user-details > div { font-size: 14px; }
        .user-details > div:last-child { font-size: 12px; color: #666; }
        .notification-badge { background: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; text-align: center; }
        .stat-value { font-size: 28px; font-weight: 600; color: #2563eb; }
        .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
        .tab { padding: 0.75rem 1.5rem; background: transparent; border: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; border-bottom: 2px solid transparent; }
        .tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        .content { background: white; border-radius: 12px; padding: 1.5rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 0.35rem; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; font-family: inherit; }
        .btn { padding: 0.6rem 1.2rem; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
        .btn:hover { background: #1d4ed8; }
        .btn-secondary { background: #f3f4f6; color: #333; border: 1px solid #e5e7eb; }
        .btn-small { padding: 0.35rem 0.75rem; font-size: 12px; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 1rem; }
        .table th { background: #f3f4f6; padding: 0.75rem; text-align: left; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
        .table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
        .login-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .login-box { background: white; border-radius: 12px; padding: 2.5rem; max-width: 400px; width: 90%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        .login-box h1 { font-size: 24px; margin-bottom: 2rem; text-align: center; }
        .login-info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin-top: 1.5rem; font-size: 12px; color: #1e40af; }
        .notification { position: fixed; top: 20px; right: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem 1.5rem; max-width: 400px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 2000; }
    <\/style>
</head>
<body>
    <div id="app"><\/div>
    <script>
        const app = {
            state: { currentUser: null, currentRole: null, users: {'jasmine': {password: 'jasmine123', name: 'Jasmine Koui', role: 'acheteur'}, 'cheick': {password: 'cheick123', name: 'Cheick Cissé', role: 'acheteur'}, 'issouf': {password: 'issouf123', name: 'Mr Issouf Bamba', role: 'dg'}, 'compta': {password: 'compta123', name: 'Comptabilité', role: 'compta'}}, demandes: [], notifications: [], currentTab: 'demandes' },
            async init() { if (!this.state.currentUser) { this.renderLogin(); } else { await this.loadDemandes(); this.render(); setInterval(() => this.loadDemandes(), 3000); } },
            login(username, password) { const user = this.state.users[username.toLowerCase()]; if (user && user.password === password) { this.state.currentUser = user.name; this.state.currentRole = user.role; this.notify('Bienvenue ' + user.name + '!', 'success'); this.init(); } else { this.notify('Identifiants invalides', 'error'); } },
            logout() { this.state.currentUser = null; this.state.currentRole = null; this.init(); },
            notify(message, type = 'info') { const id = Date.now(); this.state.notifications.push({id, message, type}); setTimeout(() => { this.state.notifications = this.state.notifications.filter(n => n.id !== id); }, 4000); },
            async loadDemandes() { try { const response = await fetch('/api/demandes'); this.state.demandes = await response.json(); this.render(); } catch (error) { console.error('Erreur:', error); } },
            getDAsToApprove() { if (this.state.currentRole === 'dg') { return this.state.demandes.filter(d => d.approvals.acheteur.approuve && !d.approvals.dg.approuve && d.statut === 'En attente'); } else if (this.state.currentRole === 'compta') { return this.state.demandes.filter(d => d.approvals.dg.approuve && !d.approvals.compta.approuve && d.statut === 'Approuvée - En attente Compta'); } return []; },
            async createDA(data) { try { await fetch('/api/demandes', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...data, demandeur: this.state.currentUser}) }); this.notify('DA créée!', 'success'); await this.loadDemandes(); this.state.currentTab = 'demandes'; } catch (error) { this.notify('Erreur', 'error'); } },
            async approveDA(id) { try { await fetch('/api/demandes/' + id + '/approve', { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({role: this.state.currentRole}) }); this.notify('DA #' + id + ' approuvée!', 'success'); await this.loadDemandes(); } catch (error) { this.notify('Erreur', 'error'); } },
            async rejectDA(id) { try { await fetch('/api/demandes/' + id + '/reject', { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({role: this.state.currentRole}) }); this.notify('DA #' + id + ' rejetée', 'error'); await this.loadDemandes(); } catch (error) { this.notify('Erreur', 'error'); } },
            renderLogin() { document.getElementById('app').innerHTML = '<div class="login-container"><div class="login-box"><h1>Gestion des Demandes<\/h1><form id="loginForm" onsubmit="app.handleLogin(event)"><div class="form-group"><label>Identifiant<\/label><input type="text" id="username" placeholder="jasmine" required autofocus><\/div><div class="form-group"><label>Mot de passe<\/label><input type="password" id="password" placeholder="jasmine123" required><\/div><button type="submit" class="btn" style="width: 100%;">Connexion<\/button><\/form><div class="login-info"><strong>Comptes:<\/strong><br>jasmine \/ jasmine123<br>cheick \/ cheick123<br>issouf \/ issouf123<br>compta \/ compta123<\/div><\/div><\/div>'; },
            handleLogin(e) { e.preventDefault(); const username = document.getElementById('username').value; const password = document.getElementById('password').value; this.login(username, password); },
            render() { const daToApprove = this.getDAsToApprove(); const demandes = this.state.demandes.filter(d => d.statut !== 'Validée' && d.statut !== 'Rejetée'); let html = '<div class="container"><div class="header"><div class="header-top"><div><h1>Gestion des Demandes<\/h1><\/div><div style="display:flex; gap:1rem; align-items:center;"><div class="avatar">' + this.state.currentUser.charAt(0) + '<\/div><div class="user-details"><div>' + this.state.currentUser + '<\/div><\/div>' + (daToApprove.length > 0 ? '<div class="notification-badge">' + daToApprove.length + '<\/div>' : '') + '<button class="btn btn-secondary btn-small" onclick="app.logout()">Déco<\/button><\/div><\/div><div class="stats-grid"><div class="stat-card"><div class="stat-value">' + this.state.demandes.length + '<\/div>Total<\/div><div class="stat-card"><div class="stat-value">' + this.state.demandes.filter(d => d.statut === 'En attente').length + '<\/div>Attente<\/div><\/div><\/div><div class="tabs"><button class="tab' + (this.state.currentTab === 'demandes' ? ' active' : '') + '" onclick="app.switchTab(\\'demandes\\')">Demandes<\/button><button class="tab' + (this.state.currentTab === 'creer' ? ' active' : '') + '" onclick="app.switchTab(\\'creer\\')">Créer<\/button><\/div><div class="content">'; if (this.state.currentTab === 'demandes') { if (demandes.length === 0) { html += 'Aucune demande'; } else { html += '<table class="table"><thead><tr><th>ID<\/th><th>Filiale<\/th><th>Montant<\/th><th>Actions<\/th><\/tr><\/thead><tbody>'; demandes.forEach(da => { html += '<tr><td>#' + da.id + '<\/td><td>' + da.filiale + '<\/td><td>' + da.montant + ' XOF<\/td><td>' + ((this.state.currentRole === 'dg' && da.approvals.acheteur.approuve && !da.approvals.dg.approuve) || (this.state.currentRole === 'compta' && da.approvals.dg.approuve && !da.approvals.compta.approuve) ? '<button class="btn btn-small" style="background: #10b981;" onclick="app.approveDA(' + da.id + ')">OK<\/button>' : '') + '<\/td><\/tr>'; }); html += '<\/tbody><\/table>'; } } else if (this.state.currentTab === 'creer') { html += '<form id="formDA" onsubmit="app.handleCreateDA(event)" style="max-width: 600px;"><div class="form-group"><label>Filiale<\/label><select name="filiale" required><option>PC PLUS GROUP<\/option><option>SINO AFRIC<\/option><\/select><\/div><div class="form-group"><label>Montant<\/label><input type="number" name="montant" required><\/div><div class="form-group"><label>Urgence<\/label><select name="urgence" required><option>Normal<\/option><option>Urgent<\/option><\/select><\/div><button type="submit" class="btn">Créer<\/button><\/form>'; } html += '<\/div><\/div>'; document.getElementById('app').innerHTML = html; },
            switchTab(tab) { this.state.currentTab = tab; this.render(); },
            handleCreateDA(e) { e.preventDefault(); const form = e.target; const data = { filiale: form.filiale.value, description: 'Demande', montant: form.montant.value, urgence: form.urgence.value }; this.createDA(data); form.reset(); }
        };
        app.init();
    <\/script>
</body>
</html>`;

module.exports = (req, res) => {
    // Activer CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Routes API
    if (req.url === '/api/demandes' && req.method === 'GET') {
        res.json(demandes);
    } else if (req.url === '/api/demandes' && req.method === 'POST') {
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
    } else if (req.url.includes('/api/demandes/') && req.url.includes('/approve') && req.method === 'PUT') {
        const id = parseInt(req.url.split('/')[3]);
        const { role } = req.body;
        const da = demandes.find(d => d.id === id);
        if (!da) {
            res.status(404).json({ error: 'Not found' });
        } else {
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
        }
    } else if (req.url.includes('/api/demandes/') && req.url.includes('/reject') && req.method === 'PUT') {
        const id = parseInt(req.url.split('/')[3]);
        const da = demandes.find(d => d.id === id);
        if (!da) {
            res.status(404).json({ error: 'Not found' });
        } else {
            da.statut = 'Rejetée';
            res.json(da);
        }
    } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(getHTML());
    }
};
