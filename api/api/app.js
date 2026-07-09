const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

let demandes = [];
let nextId = 1;

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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
