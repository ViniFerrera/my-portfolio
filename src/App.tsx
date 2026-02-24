import React, { useState, useEffect } from 'react';
import { Menu, X, Github, Linkedin, Mail, Plus, Edit2, Trash2, PieChart, Layout, Bot, Database, Award, Save, Image as ImageIcon, ExternalLink, PlusCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : null;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'portfolio-vinicius';

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState(null);

  const [profile, setProfile] = useState({
    name: 'Vinicius Ferreira',
    bio: 'Especialista em Power Platform, com foco em Power BI, desenvolvimentos em Power Apps e automações com Power Automate.',
    yearsExp: '4+',
    aboutText: 'Anos de experiência com Power Platform e soluções de automação. Comecei com Excel e, conforme fui me aprofundando, evoluí para Power BI avançado (incluindo M), Power Apps, Power Automate e integração entre sistemas. Também atuo com desenvolvimento de APIs em Python e SQL, unindo análise, automação e construção de soluções inteligentes.',
    phone: '81982851143',
    email: 'viniemisu@gmail.com',
    linkedin: 'viniciusjsferreira',
    avatarUrl: '',
    ownerUid: '',
    certifications: [
      { id: Date.now(), title: 'Power BI Data Analyst', issuer: 'Microsoft Certified', level: 'Associate' }
    ]
  });

  const [projetos, setProjetos] = useState([]);
  const [projetoAtual, setProjetoAtual] = useState({ id: null, titulo: '', descricao: '', tecnologias: '', github: '', link: '', imageUrl: '', contentImages: [] });

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'profile', 'main');
    const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');

    getDoc(profileRef).then((snap) => {
      if (!snap.exists()) setDoc(profileRef, { ...profile, ownerUid: user.uid });
    });

    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(prev => ({...prev, ...data}));
        if (data.ownerUid === user.uid) setIsAdmin(true);
      }
    });

    const unsubProjects = onSnapshot(projectsRef, (snap) => {
      setProjetos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubProfile(); unsubProjects(); };
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profile', 'main'), profile);
    setIsProfileModalOpen(false);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const data = { 
      ...projetoAtual, 
      tecnologias: typeof projetoAtual.tecnologias === 'string' ? projetoAtual.tecnologias.split(',').map(t => t.trim()) : projetoAtual.tecnologias 
    };
    if (projetoAtual.id) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projetoAtual.id), data);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), data);
    }
    setIsProjectModalOpen(false);
    setProjetoAtual({ id: null, titulo: '', descricao: '', tecnologias: '', github: '', link: '', imageUrl: '', contentImages: [] });
  };

  const formatPhone = (phone) => phone.replace(/\D/g, '');

  const handleMultipleImages = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    for (let file of files) {
      const base64 = await compressImage(file);
      newImages.push(base64);
    }
    setProjetoAtual(prev => ({ ...prev, contentImages: [...(prev.contentImages || []), ...newImages] }));
  };

  const addCert = () => setProfile(prev => ({...prev, certifications: [...(prev.certifications || []), { id: Date.now(), title: '', issuer: '', level: '' }]}));
  const updateCert = (id, field, val) => setProfile(prev => ({...prev, certifications: prev.certifications.map(c => c.id === id ? {...c, [field]: val} : c)}));
  const removeCert = (id) => setProfile(prev => ({...prev, certifications: prev.certifications.filter(c => c.id !== id)}));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      <nav className="fixed w-full bg-[#09090b]/95 backdrop-blur-md z-40 border-b border-purple-900/20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center relative">
          <div className="font-bold text-xl tracking-tighter cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            Vinicius<span className="text-purple-500">Ferreira</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {['Sobre', 'Habilidades', 'Projetos', 'Contato'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-zinc-400 hover:text-purple-400 transition-colors">{item}</a>
            ))}
            {isAdmin && (
              <button onClick={() => setIsProfileModalOpen(true)} className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-full transition-colors">
                <Edit2 size={18}/>
              </button>
            )}
          </div>
          <div className="md:hidden flex items-center gap-4">
            {isAdmin && (
              <button onClick={() => setIsProfileModalOpen(true)} className="text-purple-400"><Edit2 size={20}/></button>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-zinc-400 p-2">
              {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-[#0f0f13] border-b border-purple-900/20 shadow-2xl z-40">
            <div className="flex flex-col px-4 py-4 space-y-4">
              {['Sobre', 'Habilidades', 'Projetos', 'Contato'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-zinc-300 hover:text-purple-400 font-medium p-2">{item}</a>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="pt-16">
        <section id="hero" className="max-w-6xl mx-auto px-4 py-20 flex flex-col-reverse md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h2 className="text-purple-500 font-semibold uppercase text-xs tracking-widest">Olá! Meu nome é</h2>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">{profile.name}</h1>
            <p className="text-zinc-400 text-lg font-light leading-relaxed max-w-xl mx-auto md:mx-0">{profile.bio}</p>
            <div className="flex gap-4 justify-center md:justify-start">
              <a href="#projetos" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-all text-white">Ver Projetos</a>
              <a href="#contato" className="px-6 py-3 border border-zinc-700 hover:bg-zinc-800 rounded-lg font-medium transition-all text-zinc-300">Contato</a>
            </div>
          </div>
          
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-transparent to-blue-500 animate-[spin_4s_linear_infinite] opacity-80 blur-sm"></div>
            <div className="absolute inset-1 rounded-full bg-[#09090b] z-0"></div>
            <div className="relative w-[96%] h-[96%] rounded-full border-4 border-zinc-900 shadow-[0_0_40px_rgba(168,85,247,0.15)] flex items-center justify-center overflow-hidden bg-zinc-800 z-10">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-zinc-600">
                  <ImageIcon size={48} className="mb-2 opacity-50"/>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="sobre" className="bg-zinc-900/30 py-16 border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3"><div className="w-1.5 h-6 bg-purple-500 rounded-full"/>Sobre mim</h3>
            <div className="bg-zinc-900/80 p-8 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-8 items-center">
              <span className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-purple-700 shrink-0">{profile.yearsExp}</span>
              <p className="text-zinc-400 leading-relaxed font-light text-lg">{profile.aboutText}</p>
            </div>
          </div>
        </section>

        <section id="habilidades" className="py-12 max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3"><div className="w-1.5 h-6 bg-purple-500 rounded-full"/>Principais habilidades</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: PieChart, title: 'Visualização de Dados', desc: 'Power BI, Tableau e Excel avançado.' },
              { icon: Layout, title: 'Dev. de Power Apps', desc: 'Apps escaláveis com Power Platform.' },
              { icon: Bot, title: 'IA e Python', desc: 'Automações utilizando Python e APIs.' },
              { icon: Database, title: 'Banco de Dados', desc: 'Sólido conhecimento em SQL avançado.' }
            ].map((hab, i) => (
              <div key={i} className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group">
                <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <hab.icon className="text-purple-500" size={24}/>
                </div>
                <h4 className="font-semibold text-white mb-2">{hab.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">{hab.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="projetos" className="bg-zinc-900/20 py-12 border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold flex items-center gap-3"><div className="w-1.5 h-6 bg-purple-500 rounded-full"/>Projetos desenvolvidos</h3>
              {isAdmin && (
                <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2 rounded-lg text-sm font-medium text-white">
                  <Plus size={18}/> Novo
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projetos.map(proj => (
                <div key={proj.id} className="bg-zinc-900/60 rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all flex flex-col group relative cursor-pointer" onClick={() => setSelectedProject(proj)}>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setProjetoAtual({...proj, tecnologias: proj.tecnologias.join(', ')}); setIsProjectModalOpen(true); }} className="p-2 bg-zinc-800 rounded-lg text-zinc-300 hover:text-white"><Edit2 size={14}/></button>
                      <button onClick={async (e) => { e.stopPropagation(); await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', proj.id)); }} className="p-2 bg-red-900/80 rounded-lg text-red-200 hover:text-white"><Trash2 size={14}/></button>
                    </div>
                  )}
                  <div className="h-48 bg-zinc-800/50 flex items-center justify-center relative overflow-hidden">
                    {proj.imageUrl ? <img src={proj.imageUrl} alt={proj.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <ImageIcon className="text-zinc-700" size={40}/>}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="font-bold text-white mb-2 text-lg">{proj.titulo}</h4>
                    <p className="text-sm text-zinc-400 mb-6 flex-1 font-light leading-relaxed line-clamp-3">{proj.descricao}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {proj.tecnologias?.slice(0,4).map((t, idx) => (
                        <span key={idx} className="text-[11px] bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/20 font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="py-20 max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="text-3xl font-bold tracking-tight flex items-center gap-3"><div className="w-1.5 h-6 bg-purple-500 rounded-full"/>Entre em contato</h3>
              <p className="text-zinc-400 font-light text-lg pb-4">Tem um projeto em mente ou quer bater um papo? Sinta-se à vontade para me chamar.</p>
              <div className="space-y-4">
                <a href={`https://wa.me/55${formatPhone(profile.phone)}?text=Olá%20Vinicius,%20vi%20seu%20portfólio%20e%20gostaria%20de%20conversar.`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-purple-500/40 transition-all">
                  <div className="bg-purple-500/10 p-3 rounded-lg text-purple-500"><WhatsAppIcon size={24}/></div>
                  <div><p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">WhatsApp</p><p className="font-medium text-zinc-200">{profile.phone}</p></div>
                </a>
                <a href={`mailto:${profile.email}`} className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-purple-500/40 transition-all">
                  <div className="bg-purple-500/10 p-3 rounded-lg text-purple-500"><Mail size={24}/></div>
                  <div><p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">E-mail</p><p className="font-medium text-zinc-200">{profile.email}</p></div>
                </a>
                <a href={`https://linkedin.com/in/${profile.linkedin.replace(/^\//, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-purple-500/40 transition-all">
                  <div className="bg-purple-500/10 p-3 rounded-lg text-purple-500"><Linkedin size={24}/></div>
                  <div><p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">LinkedIn</p><p className="font-medium text-zinc-200">/{profile.linkedin.replace(/^\//, '')}</p></div>
                </a>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 flex flex-col items-center gap-6 mt-8 md:mt-0">
              {profile.certifications?.map((cert, index) => (
                <div key={index} className="bg-zinc-900/60 p-8 rounded-3xl border border-purple-500/20 flex flex-col items-center text-center w-full max-w-sm shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Award className="text-blue-500 mb-4 relative z-10" size={56}/>
                  <h4 className="font-bold text-white text-sm mb-1 relative z-10">{cert.issuer}</h4>
                  <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-3 relative z-10">{cert.title}</p>
                  <div className="w-16 h-1 bg-blue-500/30 rounded-full mb-3 relative z-10"/>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest relative z-10">{cert.level}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-white/5 text-center text-zinc-600 text-sm bg-[#09090b]">
        <p>© {new Date().getFullYear()} {profile.name}. Todos os direitos reservados.</p>
      </footer>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h3 className="font-bold text-xl flex items-center gap-2"><Edit2 className="text-purple-500" size={20}/> Editar Perfil</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-zinc-500 hover:text-white"><X/></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Nome Completo</label>
                  <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Anos Experiência</label>
                  <input type="text" value={profile.yearsExp} onChange={e => setProfile({...profile, yearsExp: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Bio Curta</label>
                <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" rows="2" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Texto Sobre Mim Detalhado</label>
                <textarea value={profile.aboutText} onChange={e => setProfile({...profile, aboutText: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" rows="4" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Telefone / WhatsApp</label>
                  <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">E-mail</label>
                  <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">LinkedIn (@usuario)</label>
                <input type="text" value={profile.linkedin} onChange={e => setProfile({...profile, linkedin: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" />
              </div>
              
              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-white">Certificações (Badges)</h4>
                  <button type="button" onClick={addCert} className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded flex items-center gap-1"><Plus size={14}/> Adicionar</button>
                </div>
                <div className="space-y-3">
                  {profile.certifications?.map((cert, index) => (
                    <div key={cert.id} className="bg-zinc-900 p-3 rounded-lg border border-white/5 relative">
                      <button type="button" onClick={() => removeCert(cert.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                      <div className="grid grid-cols-2 gap-2 pr-6">
                        <input placeholder="Emissor (Ex: Microsoft)" value={cert.issuer} onChange={e => updateCert(cert.id, 'issuer', e.target.value)} className="bg-zinc-800 p-2 rounded text-xs w-full text-white" />
                        <input placeholder="Título (Ex: Power BI)" value={cert.title} onChange={e => updateCert(cert.id, 'title', e.target.value)} className="bg-zinc-800 p-2 rounded text-xs w-full text-white" />
                        <input placeholder="Nível (Ex: Associate)" value={cert.level} onChange={e => updateCert(cert.id, 'level', e.target.value)} className="bg-zinc-800 p-2 rounded text-xs w-full text-white col-span-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-dashed border-purple-500/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><ImageIcon size={20}/></div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-200 font-medium">Anexar Nova Foto de Perfil</p>
                    <p className="text-xs text-zinc-500">A imagem será otimizada automaticamente.</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files[0];
                    if(file) setProfile({...profile, avatarUrl: await compressImage(file)});
                  }} />
                </label>
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 transition-colors py-3.5 rounded-xl font-bold text-white mt-4 flex justify-center items-center gap-2">
                <Save size={18}/> Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h3 className="font-bold text-xl flex items-center gap-2"><Layout className="text-purple-500" size={20}/> {projetoAtual.id ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-zinc-500 hover:text-white"><X/></button>
            </div>
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Título</label>
                <input required value={projetoAtual.titulo} onChange={e => setProjetoAtual({...projetoAtual, titulo: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Descrição do Projeto</label>
                <textarea required value={projetoAtual.descricao} onChange={e => setProjetoAtual({...projetoAtual, descricao: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" rows="3" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Tecnologias (Separadas por vírgula)</label>
                <input required value={projetoAtual.tecnologias} onChange={e => setProjetoAtual({...projetoAtual, tecnologias: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" placeholder="Ex: Power BI, SQL, Python" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Link GitHub (Opcional)</label>
                  <input value={projetoAtual.github} onChange={e => setProjetoAtual({...projetoAtual, github: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Link Externo/Deploy (Opcional)</label>
                  <input value={projetoAtual.link} onChange={e => setProjetoAtual({...projetoAtual, link: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm border border-white/5 focus:border-purple-500 outline-none" />
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-dashed border-purple-500/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><ImageIcon size={20}/></div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-200 font-medium">Anexar Capa do Projeto</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files[0];
                    if(file) setProjetoAtual({...projetoAtual, imageUrl: await compressImage(file)});
                  }} />
                </label>
                {projetoAtual.imageUrl && <div className="mt-2 text-xs text-green-400">Capa anexada ✓</div>}
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-xl border border-dashed border-blue-500/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><PlusCircle size={20}/></div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-200 font-medium">Imagens de Conteúdo (Múltiplas)</p>
                    <p className="text-xs text-zinc-500">Anexe imagens extras para exibir nos detalhes.</p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultipleImages} />
                </label>
                {projetoAtual.contentImages?.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    {projetoAtual.contentImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setProjetoAtual(p => ({...p, contentImages: p.contentImages.filter((_, i) => i !== idx)}))} className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 transition-colors py-3.5 rounded-xl font-bold text-white mt-4 flex justify-center items-center gap-2">
                <Save size={18}/> Salvar Projeto
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="font-bold text-2xl text-white">{selectedProject.titulo}</h3>
              <button onClick={() => setSelectedProject(null)} className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-800"><X size={28}/></button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                  <div>
                    <h4 className="text-purple-500 font-bold mb-2 uppercase tracking-wider text-sm">Sobre o Projeto</h4>
                    <p className="text-zinc-300 font-light leading-relaxed">{selectedProject.descricao}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-purple-500 font-bold mb-3 uppercase tracking-wider text-sm">Tecnologias</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tecnologias?.map((t, idx) => (
                        <span key={idx} className="text-xs bg-purple-500/10 text-purple-300 px-3 py-1.5 rounded-full border border-purple-500/20 font-medium">{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    {selectedProject.link && (
                      <a href={selectedProject.link} target="_blank" rel="noreferrer" className="flex-1 py-3 text-center text-sm bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors text-white font-medium flex items-center justify-center gap-2">
                        <ExternalLink size={18}/> Acessar Projeto
                      </a>
                    )}
                    {selectedProject.github && (
                      <a href={selectedProject.github} target="_blank" rel="noreferrer" className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-zinc-300">
                        <Github size={20}/>
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-6">
                  {selectedProject.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/5 bg-zinc-900">
                      <img src={selectedProject.imageUrl} className="w-full object-contain max-h-[400px]" alt="Capa" />
                    </div>
                  )}
                  {selectedProject.contentImages?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedProject.contentImages.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border border-white/5 bg-zinc-900 group relative">
                          <img src={img} className="w-full object-cover aspect-video hover:scale-105 transition-transform duration-500" alt={`Detalhe ${idx+1}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


