import React, { useState, useEffect } from "react";
import {
	Menu,
	X,
	Linkedin,
	Mail,
	Plus,
	Edit2,
	Trash2,
	PieChart,
	Layout,
	Bot,
	Database,
	Award,
	Save,
	Image as ImageIcon,
	PlusCircle,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
	getFirestore,
	collection,
	doc,
	setDoc,
	getDoc,
	addDoc,
	deleteDoc,
	onSnapshot,
} from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyBzFIuUdbjnYwcrsF5JEwet_dTO8tbeONs",
	authDomain: "my-portfolio-5cc1e.firebaseapp.com",
	projectId: "my-portfolio-5cc1e",
	storageBucket: "my-portfolio-5cc1e.firebasestorage.app",
	messagingSenderId: "240715500597",
	appId: "1:240715500597:web:d89faae72048ec2cb8357c",
	measurementId: "G-ZR607HP1B9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "portfolio-vinicius";

interface Certification {
	id: number;
	title: string;
	issuer: string;
	level: string;
}

interface Profile {
	name: string;
	bio: string;
	yearsExp: string;
	aboutText: string;
	phone: string;
	email: string;
	linkedin: string;
	avatarUrl: string;
	ownerUid: string;
	certifications: Certification[];
}

interface Project {
	id: string | null;
	titulo: string;
	descricao: string;
	tecnologias: string[] | string;
	github: string;
	link: string;
	imageUrl: string;
	contentImages: string[];
}

const compressImage = (file: File): Promise<string> => {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				const MAX_WIDTH = 800;
				let width = img.width;
				let height = img.height;
				if (width > MAX_WIDTH) {
					height = Math.round((height * MAX_WIDTH) / width);
					width = MAX_WIDTH;
				}
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				ctx?.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL("image/jpeg", 0.6));
			};
			if (event.target?.result) img.src = event.target.result as string;
		};
		reader.readAsDataURL(file);
	});
};

const WhatsAppIcon = ({ size = 24, className = "" }) => (
	<svg
		width={size}
		height={size}
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'
		className={className}
	>
		<path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' />
	</svg>
);

const App = () => {
	const [user, setUser] = useState<any>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
	const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);

	const [profile, setProfile] = useState<Profile>({
		name: "Vinicius Ferreira",
		bio: "Especialista em Power Platform, com foco em Power BI, desenvolvimentos em Power Apps e automações com Power Automate.",
		yearsExp: "4+",
		aboutText:
			"Anos de experiência com Power Platform e soluções de automação.",
		phone: "81982851143",
		email: "viniemisu@gmail.com",
		linkedin: "viniciusjsferreira",
		avatarUrl: "",
		ownerUid: "",
		certifications: [],
	});

	const [projetos, setProjetos] = useState<Project[]>([]);
	const [projetoAtual, setProjetoAtual] = useState<Project>({
		id: null,
		titulo: "",
		descricao: "",
		tecnologias: "",
		github: "",
		link: "",
		imageUrl: "",
		contentImages: [],
	});

	useEffect(() => {
		signInAnonymously(auth).catch(console.error);
		return onAuthStateChanged(auth, setUser);
	}, []);

	useEffect(() => {
		if (!user) return;
		const profileRef = doc(
			db,
			"artifacts",
			appId,
			"public",
			"data",
			"profile",
			"main",
		);
		const projectsRef = collection(
			db,
			"artifacts",
			appId,
			"public",
			"data",
			"projects",
		);

		getDoc(profileRef).then((snap) => {
			if (!snap.exists())
				setDoc(profileRef, { ...profile, ownerUid: user.uid });
		});

		const unsubProfile = onSnapshot(profileRef, (snap) => {
			if (snap.exists()) {
				const data = snap.data() as Profile;
				setProfile((prev) => ({ ...prev, ...data }));
				if (data.ownerUid === user.uid) setIsAdmin(true);
			}
		});

		const unsubProjects = onSnapshot(projectsRef, (snap) => {
			setProjetos(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project));
		});

		return () => {
			unsubProfile();
			unsubProjects();
		};
	}, [user]);

	const handleAdminClaim = async () => {
		const pwd = prompt("Senha para ativar modo edição:");
		if (pwd === "vini123") {
			setIsAdmin(true);
			alert("Modo de edição ativado!");
			if (user) {
				await setDoc(
					doc(db, "artifacts", appId, "public", "data", "profile", "main"),
					{ ownerUid: user.uid },
					{ merge: true },
				);
			}
		}
	};

	const withTimeout = (promise: Promise<any>, ms: number = 5000) => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), ms)
    );
    return Promise.race([promise, timeout]);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando requisição de salvamento do perfil...");
    
    try {
      const safeProfile = JSON.parse(JSON.stringify(profile));
      // Usa a trava de 5 segundos
      await withTimeout(setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profile', 'main'), safeProfile, { merge: true }));
      
      setIsProfileModalOpen(false);
      console.log("Perfil salvo com sucesso.");
      alert("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      if (error.message === "TIMEOUT_FIREBASE") {
        alert("O Firebase demorou muito para responder. Verifique se o 'Firestore Database' foi criado no painel do Firebase.");
      } else {
        alert("Falha ao salvar. Verifique o console.");
      }
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando requisição de salvamento do projeto...");
    
    if (!projetoAtual.titulo || !projetoAtual.descricao || !projetoAtual.tecnologias) {
      alert("Por favor, preencha Título, Descrição e Tecnologias.");
      return;
    }

    try {
      const tecnologiasFormatadas = typeof projetoAtual.tecnologias === 'string' 
        ? projetoAtual.tecnologias.split(',').map(t => t.trim()) 
        : projetoAtual.tecnologias;
        
      const dataToSave = JSON.parse(JSON.stringify({ 
        ...projetoAtual, 
        tecnologias: tecnologiasFormatadas 
      }));
      delete dataToSave.id; 

      if (projetoAtual.id) {
        await withTimeout(setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projetoAtual.id), dataToSave, { merge: true }));
      } else {
        await withTimeout(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), dataToSave));
      }
      
      setIsProjectModalOpen(false);
      setProjetoAtual({ id: null, titulo: '', descricao: '', tecnologias: '', github: '', link: '', imageUrl: '', contentImages: [] });
      console.log("Projeto salvo com sucesso.");
      alert("Projeto salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar projeto:", error);
      if (error.message === "TIMEOUT_FIREBASE") {
        alert("O Firebase demorou muito para responder. Verifique se o 'Firestore Database' foi criado no painel do Firebase.");
      } else {
        alert("Falha ao salvar. Verifique o console.");
      }
    }
  };
	const formatPhone = (phone: string) => phone.replace(/\D/g, "");

	const handleMultipleImages = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = Array.from(e.target.files || []);
		const newImages: string[] = [];
		for (let file of files) {
			newImages.push(await compressImage(file));
		}
		setProjetoAtual((prev) => ({
			...prev,
			contentImages: [...(prev.contentImages || []), ...newImages],
		}));
	};

	const addCert = () =>
		setProfile((prev) => ({
			...prev,
			certifications: [
				...(prev.certifications || []),
				{ id: Date.now(), title: "", issuer: "", level: "" },
			],
		}));
	const updateCert = (id: number, field: string, val: string) =>
		setProfile((prev) => ({
			...prev,
			certifications: prev.certifications.map((c) =>
				c.id === id ? { ...c, [field]: val } : c,
			),
		}));
	const removeCert = (id: number) =>
		setProfile((prev) => ({
			...prev,
			certifications: prev.certifications.filter((c) => c.id !== id),
		}));

	return (
		<div className='min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col w-full overflow-x-hidden scroll-smooth'>
			<nav className='fixed w-full bg-[#09090b] z-40 border-b border-white/5'>
				<div className='w-full max-w-6xl mx-auto px-6 h-16 flex justify-between items-center relative'>
					<div
						className='font-bold text-xl tracking-tighter cursor-pointer'
						onClick={() => window.scrollTo(0, 0)}
					>
						Vinicius<span className='text-[#660099]'>Ferreira</span>
					</div>
					<div className='hidden md:flex items-center space-x-8'>
						{["Sobre", "Habilidades", "Projetos", "Contato"].map((item) => (
							<a
								key={item}
								href={`#${item.toLowerCase()}`}
								className='text-sm font-medium text-zinc-400 hover:text-[#660099] transition-colors'
							>
								{item}
							</a>
						))}
						{isAdmin && (
							<button
								onClick={() => setIsProfileModalOpen(true)}
								className='p-2 text-[#660099] bg-[#660099]/10 rounded-full transition-colors hover:bg-[#660099]/20'
							>
								<Edit2 size={18} />
							</button>
						)}
					</div>
					<div className='md:hidden flex items-center gap-4'>
						{isAdmin && (
							<button
								onClick={() => setIsProfileModalOpen(true)}
								className='text-[#660099]'
							>
								<Edit2 size={22} />
							</button>
						)}
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className='text-zinc-400 p-2'
						>
							{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
						</button>
					</div>
				</div>
				{isMenuOpen && (
					<div className='md:hidden absolute top-16 left-0 w-full bg-[#0f0f13] border-b border-white/5 shadow-2xl z-40'>
						<div className='flex flex-col px-6 py-6 space-y-6'>
							{["Sobre", "Habilidades", "Projetos", "Contato"].map((item) => (
								<a
									key={item}
									href={`#${item.toLowerCase()}`}
									onClick={() => setIsMenuOpen(false)}
									className='text-zinc-300 hover:text-[#660099] font-medium text-base'
								>
									{item}
								</a>
							))}
						</div>
					</div>
				)}
			</nav>

			<main className='w-full max-w-6xl mx-auto px-6 pt-24'>
				<section
					id='hero'
					className='py-12 md:py-16 flex flex-col md:flex-row items-start justify-between gap-10 w-full border-b border-white/5 pb-20'
				>
					<div className='flex-1 space-y-4 text-left mt-0 md:mt-8 w-full'>
						<h2 className='text-zinc-300 text-base md:text-lg'>
							Olá! Meu nome é
						</h2>
						<h1 className='text-5xl md:text-6xl lg:text-7xl font-bold text-[#5c9d55] tracking-tight'>
							{profile.name}
						</h1>
						<p className='text-white text-base md:text-lg font-medium leading-relaxed max-w-2xl'>
							{profile.bio}
						</p>
						<div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-6'>
							<a
								href='#projetos'
								className='px-8 py-3 bg-[#660099] hover:bg-[#550088] rounded-md font-bold transition-all text-white shadow-lg w-full sm:w-auto text-center'
							>
								Ver Projetos
							</a>
							<a
								href='#contato'
								className='px-8 py-3 border border-zinc-700 hover:bg-zinc-800 rounded-md font-bold transition-all text-zinc-300 w-full sm:w-auto text-center'
							>
								Contato
							</a>
						</div>
					</div>

					<div className='relative w-64 h-64 md:w-[400px] md:h-[400px] shrink-0 self-center md:self-start'>
						<div className='absolute inset-0 rounded-full border-[16px] border-[#202722] overflow-hidden bg-zinc-200'>
							{profile.avatarUrl ? (
								<img
									src={profile.avatarUrl}
									alt={profile.name}
									className='w-full h-full object-cover'
								/>
							) : (
								<div className='w-full h-full flex items-center justify-center bg-zinc-300'>
									<ImageIcon size={64} className='text-zinc-500' />
								</div>
							)}
						</div>
					</div>
				</section>

				<section id='sobre' className='py-16 w-full border-b border-white/5'>
					<h3 className='text-xl font-bold mb-4 text-white'>| Sobre mim:</h3>
					<p className='text-zinc-200 mb-8 text-base'>
						Seja muito bem-vindo(a) ao meu portfólio. Conheça a minha
						trajetória:
					</p>
					<div className='flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full'>
						<span className='text-6xl md:text-7xl font-bold text-[#5c9d55] leading-none shrink-0'>
							{profile.yearsExp}
						</span>
						<p className='text-white leading-relaxed text-base font-medium'>
							{profile.aboutText}
						</p>
					</div>
				</section>

				<section
					id='habilidades'
					className='bg-[#18181b] py-16 px-6 md:px-12 w-full mt-10 rounded-2xl'
				>
					<h3 className='text-xl font-bold mb-10 text-white'>
						| Principais habilidades:
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full'>
						{[
							{
								icon: PieChart,
								title: "VISUALIZAÇÃO &\nANÁLISE DE DADOS",
								desc: "Desenvolvimento de dashboards profissionais através de ferramentas como: Power BI, Tableau e Excel.",
								bg: "bg-[#5c9d55]",
								text: "text-white",
							},
							{
								icon: Layout,
								title: "DEV. DE POWER APPS",
								desc: "Desenvolvimento de aplicativos em Power Apps, mesclando todo ecossistema da Power Platform (Sharepoint, Power Apps, Power Automate, Teams e Power BI)",
								bg: "bg-[#94a3b8]",
								text: "text-white",
							},
							{
								icon: Bot,
								title: "IA E PYTHON",
								desc: "Automações de processos utilizando Python e API's, e também uso de IA para geração de Insights.",
								bg: "bg-[#94a3b8]",
								text: "text-white",
							},
							{
								icon: Database,
								title: "BANCO DE DADOS",
								desc: "Sólido conhecimento em Bancos de dados, e SQL avançado.",
								bg: "bg-[#94a3b8]",
								text: "text-white",
							},
						].map((hab, i) => (
							<div
								key={i}
								className={`${hab.bg} p-8 rounded-xl flex flex-col items-start w-full shadow-lg`}
							>
								<hab.icon className={`mb-6 ${hab.text}`} size={36} />
								<h4
									className={`font-bold text-lg mb-4 whitespace-pre-line ${hab.text}`}
								>
									{hab.title}
								</h4>
								<p className={`text-sm leading-relaxed ${hab.text}`}>
									{hab.desc}
								</p>
							</div>
						))}
					</div>
				</section>

				<section
					id='projetos'
					className='py-16 w-full border-y border-white/5 mt-10'
				>
					<div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6'>
						<h3 className='text-xl font-bold text-white'>| Projetos:</h3>
						{isAdmin && (
							<button
								onClick={() => setIsProjectModalOpen(true)}
								className='flex items-center gap-2 bg-[#660099] hover:bg-[#550088] transition-colors px-6 py-2 rounded-md font-bold text-white shadow-lg w-full md:w-auto justify-center text-sm'
							>
								<Plus size={18} /> Novo Projeto
							</button>
						)}
					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
						{projetos.map((proj) => (
							<div
								key={proj.id}
								className='bg-[#18181b] rounded-xl overflow-hidden border border-white/5 hover:border-[#660099]/50 transition-all flex flex-col group relative shadow-lg w-full cursor-pointer'
								onClick={() => setSelectedProject(proj)}
							>
								{isAdmin && (
									<div className='absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity'>
										<button
											onClick={(e) => {
												e.stopPropagation();
												setProjetoAtual({
													...proj,
													tecnologias: Array.isArray(proj.tecnologias)
														? proj.tecnologias.join(", ")
														: proj.tecnologias,
												});
												setIsProjectModalOpen(true);
											}}
											className='p-2 bg-zinc-800 rounded-md text-zinc-300 hover:text-white shadow-lg'
										>
											<Edit2 size={16} />
										</button>
										<button
											onClick={async (e) => {
												e.stopPropagation();
												try {
													await deleteDoc(
														doc(
															db,
															"artifacts",
															appId,
															"public",
															"data",
															"projects",
															proj.id as string,
														),
													);
												} catch (error) {
													console.error(error);
												}
											}}
											className='p-2 bg-red-900/80 rounded-md text-red-200 hover:text-white shadow-lg'
										>
											<Trash2 size={16} />
										</button>
									</div>
								)}
								<div className='h-48 bg-zinc-800 flex items-center justify-center relative overflow-hidden w-full'>
									{proj.imageUrl ? (
										<img
											src={proj.imageUrl}
											alt={proj.titulo}
											className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
										/>
									) : (
										<ImageIcon className='text-zinc-600' size={40} />
									)}
								</div>
								<div className='p-6 flex-1 flex flex-col w-full'>
									<h4 className='font-bold text-white text-lg mb-2'>
										{proj.titulo}
									</h4>
									<p className='text-sm text-zinc-400 mb-4 flex-1 font-medium leading-relaxed line-clamp-3'>
										{proj.descricao}
									</p>
									<div className='flex flex-wrap gap-2 w-full'>
										{(Array.isArray(proj.tecnologias) ? proj.tecnologias : [])
											.slice(0, 4)
											.map((t, idx) => (
												<span
													key={idx}
													className='text-[10px] uppercase bg-[#660099]/10 text-white px-2 py-1 rounded border border-[#660099]/30 font-bold tracking-wider'
												>
													{t}
												</span>
											))}
									</div>
								</div>
							</div>
						))}
					</div>
				</section>

				<section id='contato' className='py-16 w-full mb-12'>
					<div className='flex flex-col lg:flex-row justify-between items-start gap-12 w-full'>
						<div className='w-full lg:w-1/2 space-y-6'>
							<h3 className='text-xl font-bold text-white'>
								| Entre em contato:
							</h3>
							<p className='text-zinc-300 text-base pb-2'>
								Tem um projeto em mente ou quer bater um papo? Sinta-se à
								vontade para me chamar.
							</p>
							<div className='space-y-4 w-full'>
								<a
									href={`https://wa.me/55${formatPhone(profile.phone)}`}
									target='_blank'
									rel='noreferrer'
									className='flex items-center gap-5 p-5 bg-[#18181b] rounded-xl border border-white/5 hover:border-[#660099]/50 transition-all shadow-lg w-full group'
								>
									<div className='bg-[#660099]/10 p-3 rounded-md text-[#660099] group-hover:bg-[#660099] group-hover:text-white transition-colors'>
										<WhatsAppIcon size={24} />
									</div>
									<div>
										<p className='text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1'>
											WhatsApp
										</p>
										<p className='font-medium text-white text-base'>
											{profile.phone}
										</p>
									</div>
								</a>
								<a
									href={`mailto:${profile.email}`}
									className='flex items-center gap-5 p-5 bg-[#18181b] rounded-xl border border-white/5 hover:border-[#660099]/50 transition-all shadow-lg w-full group'
								>
									<div className='bg-[#660099]/10 p-3 rounded-md text-[#660099] group-hover:bg-[#660099] group-hover:text-white transition-colors'>
										<Mail size={24} />
									</div>
									<div>
										<p className='text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1'>
											E-mail
										</p>
										<p className='font-medium text-white text-base truncate w-48 sm:w-auto'>
											{profile.email}
										</p>
									</div>
								</a>
								<a
									href={`https://linkedin.com/in/${profile.linkedin.replace(/^\//, "")}`}
									target='_blank'
									rel='noreferrer'
									className='flex items-center gap-5 p-5 bg-[#18181b] rounded-xl border border-white/5 hover:border-[#660099]/50 transition-all shadow-lg w-full group'
								>
									<div className='bg-[#660099]/10 p-3 rounded-md text-[#660099] group-hover:bg-[#660099] group-hover:text-white transition-colors'>
										<Linkedin size={24} />
									</div>
									<div>
										<p className='text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1'>
											LinkedIn
										</p>
										<p className='font-medium text-white text-base'>
											/{profile.linkedin.replace(/^\//, "")}
										</p>
									</div>
								</a>
							</div>
						</div>

						<div className='w-full lg:w-1/3 flex flex-col items-start gap-4 w-full'>
							{profile.certifications?.map((cert, index) => (
								<div
									key={index}
									className='bg-[#18181b] p-6 rounded-xl border border-white/5 flex flex-col items-start text-left w-full sm:max-w-sm shadow-lg relative overflow-hidden group hover:border-[#660099]/30 transition-colors'
								>
									<Award
										className='text-[#660099] mb-4 relative z-10'
										size={32}
									/>
									<h4 className='font-bold text-white text-base mb-1 relative z-10'>
										{cert.issuer}
									</h4>
									<p className='text-zinc-300 font-bold text-xs uppercase tracking-widest mb-3 relative z-10'>
										{cert.title}
									</p>
									<p className='text-zinc-500 text-[10px] uppercase font-bold tracking-widest relative z-10'>
										{cert.level}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>

			<footer className='w-full py-6 border-t border-white/5 text-center text-zinc-500 text-sm bg-[#09090b]'>
				<p
					onDoubleClick={handleAdminClaim}
					className='select-none cursor-default'
				>
					© {new Date().getFullYear()} {profile.name}. Todos os direitos
					reservados.
				</p>
			</footer>

			{isProfileModalOpen && (
				<div className='fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4'>
					<div className='bg-[#18181b] border border-white/10 rounded-xl p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]'>
						<div className='flex justify-between items-center mb-8 border-b border-white/5 pb-4'>
							<h3 className='font-bold text-xl flex items-center gap-3'>
								<Edit2 className='text-[#660099]' size={20} /> Editar Perfil
							</h3>
							<button
								onClick={() => setIsProfileModalOpen(false)}
								className='text-zinc-500 hover:text-white'
							>
								<X size={24} />
							</button>
						</div>
						<form onSubmit={handleSaveProfile} className='space-y-6'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
								<div>
									<label className='text-sm font-medium text-zinc-400 mb-2 block'>
										Nome Completo
									</label>
									<input
										type='text'
										value={profile.name}
										onChange={(e) =>
											setProfile({ ...profile, name: e.target.value })
										}
										className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									/>
								</div>
								<div>
									<label className='text-sm font-medium text-zinc-400 mb-2 block'>
										Anos Experiência
									</label>
									<input
										type='text'
										value={profile.yearsExp}
										onChange={(e) =>
											setProfile({ ...profile, yearsExp: e.target.value })
										}
										className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									/>
								</div>
							</div>
							<div>
								<label className='text-sm font-medium text-zinc-400 mb-2 block'>
									Bio Curta
								</label>
								<textarea
									value={profile.bio}
									onChange={(e) =>
										setProfile({ ...profile, bio: e.target.value })
									}
									className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									rows={2}
								/>
							</div>
							<div>
								<label className='text-sm font-medium text-zinc-400 mb-2 block'>
									Texto Sobre Mim
								</label>
								<textarea
									value={profile.aboutText}
									onChange={(e) =>
										setProfile({ ...profile, aboutText: e.target.value })
									}
									className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									rows={4}
								/>
							</div>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
								<div>
									<label className='text-sm font-medium text-zinc-400 mb-2 block'>
										Telefone / WhatsApp
									</label>
									<input
										type='text'
										value={profile.phone}
										onChange={(e) =>
											setProfile({ ...profile, phone: e.target.value })
										}
										className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									/>
								</div>
								<div>
									<label className='text-sm font-medium text-zinc-400 mb-2 block'>
										E-mail
									</label>
									<input
										type='text'
										value={profile.email}
										onChange={(e) =>
											setProfile({ ...profile, email: e.target.value })
										}
										className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									/>
								</div>
							</div>

							<div className='mt-6 border-t border-white/5 pt-6'>
								<div className='flex justify-between items-center mb-4'>
									<h4 className='font-bold text-white text-sm'>
										Certificações
									</h4>
									<button
										type='button'
										onClick={addCert}
										className='text-xs font-bold bg-[#660099]/20 text-white px-3 py-1.5 rounded flex items-center gap-2 hover:bg-[#660099]/40'
									>
										<Plus size={14} /> Adicionar
									</button>
								</div>
								<div className='space-y-4'>
									{profile.certifications?.map((cert) => (
										<div
											key={cert.id}
											className='bg-zinc-900 p-4 rounded-md border border-white/5 relative'
										>
											<button
												type='button'
												onClick={() => removeCert(cert.id)}
												className='absolute top-2 right-2 text-red-400 hover:text-red-300 p-1'
											>
												<Trash2 size={14} />
											</button>
											<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8'>
												<input
													placeholder='Emissor'
													value={cert.issuer}
													onChange={(e) =>
														updateCert(cert.id, "issuer", e.target.value)
													}
													className='bg-zinc-800 p-2 rounded text-xs w-full text-white border border-transparent focus:border-[#660099] outline-none'
												/>
												<input
													placeholder='Título'
													value={cert.title}
													onChange={(e) =>
														updateCert(cert.id, "title", e.target.value)
													}
													className='bg-zinc-800 p-2 rounded text-xs w-full text-white border border-transparent focus:border-[#660099] outline-none'
												/>
												<input
													placeholder='Nível'
													value={cert.level}
													onChange={(e) =>
														updateCert(cert.id, "level", e.target.value)
													}
													className='bg-zinc-800 p-2 rounded text-xs w-full text-white sm:col-span-2 border border-transparent focus:border-[#660099] outline-none'
												/>
											</div>
										</div>
									))}
								</div>
							</div>

							<div className='mt-6 p-4 bg-zinc-900 rounded-md border border-dashed border-[#660099]/50'>
								<label className='flex items-center gap-4 cursor-pointer'>
									<div className='bg-[#660099]/20 p-2 rounded text-[#660099]'>
										<ImageIcon size={20} />
									</div>
									<div className='flex-1'>
										<p className='text-sm text-white font-medium'>
											Anexar Foto de Perfil
										</p>
									</div>
									<input
										type='file'
										accept='image/*'
										className='hidden'
										onChange={async (e) => {
											const file = e.target.files?.[0];
											if (file)
												setProfile({
													...profile,
													avatarUrl: await compressImage(file),
												});
										}}
									/>
								</label>
							</div>

							<button
								type='submit'
								className='w-full bg-[#660099] hover:bg-[#550088] transition-colors py-3 rounded-md font-bold text-white mt-6 flex justify-center items-center gap-2 text-sm'
							>
								<Save size={18} /> Salvar Alterações
							</button>
						</form>
					</div>
				</div>
			)}

			{isProjectModalOpen && (
				<div className='fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4'>
					<div className='bg-[#18181b] border border-white/10 rounded-xl p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]'>
						<div className='flex justify-between items-center mb-8 border-b border-white/5 pb-4'>
							<h3 className='font-bold text-xl flex items-center gap-3'>
								<Layout className='text-[#660099]' size={20} />{" "}
								{projetoAtual.id ? "Editar Projeto" : "Novo Projeto"}
							</h3>
							<button
								onClick={() => setIsProjectModalOpen(false)}
								className='text-zinc-500 hover:text-white'
							>
								<X size={24} />
							</button>
						</div>
						<form onSubmit={handleSaveProject} className='space-y-6'>
							<div>
								<label className='text-sm font-medium text-zinc-400 mb-2 block'>
									Título
								</label>
								<input
									value={projetoAtual.titulo}
									onChange={(e) =>
										setProjetoAtual({ ...projetoAtual, titulo: e.target.value })
									}
									className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
								/>
							</div>
							<div>
								<label className='text-sm font-medium text-zinc-400 mb-2 block'>
									Descrição
								</label>
								<textarea
									value={projetoAtual.descricao}
									onChange={(e) =>
										setProjetoAtual({
											...projetoAtual,
											descricao: e.target.value,
										})
									}
									className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									rows={3}
								/>
							</div>
							<div>
								<label className='text-sm font-medium text-zinc-400 mb-2 block'>
									Tecnologias (Vírgula)
								</label>
								<input
									value={projetoAtual.tecnologias as string}
									onChange={(e) =>
										setProjetoAtual({
											...projetoAtual,
											tecnologias: e.target.value,
										})
									}
									className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
								/>
							</div>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='text-sm font-medium text-zinc-400 mb-2 block'>
										Link GitHub
									</label>
									<input
										value={projetoAtual.github}
										onChange={(e) =>
											setProjetoAtual({
												...projetoAtual,
												github: e.target.value,
											})
										}
										className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									/>
								</div>
								<div>
									<label className='text-sm font-medium text-zinc-400 mb-2 block'>
										Link Externo
									</label>
									<input
										value={projetoAtual.link}
										onChange={(e) =>
											setProjetoAtual({ ...projetoAtual, link: e.target.value })
										}
										className='w-full bg-zinc-900 p-3 rounded-md text-sm border border-white/5 focus:border-[#660099] outline-none text-white'
									/>
								</div>
							</div>

							<div className='mt-4 p-4 bg-zinc-900 rounded-md border border-dashed border-[#660099]/50'>
								<label className='flex items-center gap-4 cursor-pointer'>
									<div className='bg-[#660099]/20 p-2 rounded text-[#660099]'>
										<ImageIcon size={20} />
									</div>
									<div className='flex-1'>
										<p className='text-sm text-white font-medium'>
											Capa Principal
										</p>
									</div>
									<input
										type='file'
										accept='image/*'
										className='hidden'
										onChange={async (e) => {
											const file = e.target.files?.[0];
											if (file)
												setProjetoAtual({
													...projetoAtual,
													imageUrl: await compressImage(file),
												});
										}}
									/>
								</label>
							</div>

							<div className='p-4 bg-zinc-900 rounded-md border border-dashed border-zinc-700'>
								<label className='flex items-center gap-4 cursor-pointer'>
									<div className='bg-zinc-800 p-2 rounded text-white'>
										<PlusCircle size={20} />
									</div>
									<div className='flex-1'>
										<p className='text-sm text-white font-medium'>
											Imagens Extras
										</p>
									</div>
									<input
										type='file'
										accept='image/*'
										multiple
										className='hidden'
										onChange={handleMultipleImages}
									/>
								</label>
								{projetoAtual.contentImages?.length > 0 && (
									<div className='mt-4 flex gap-3 overflow-x-auto pb-2'>
										{projetoAtual.contentImages.map((img, idx) => (
											<div
												key={idx}
												className='relative w-20 h-20 shrink-0 rounded overflow-hidden border border-white/10 group'
											>
												<img
													src={img}
													className='w-full h-full object-cover'
													alt=''
												/>
												<button
													type='button'
													onClick={() =>
														setProjetoAtual((p) => ({
															...p,
															contentImages: p.contentImages.filter(
																(_, i) => i !== idx,
															),
														}))
													}
													className='absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex'
												>
													<Trash2 size={16} className='text-white' />
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							<button
								type='submit'
								className='w-full bg-[#660099] hover:bg-[#550088] transition-colors py-3 rounded-md font-bold text-white mt-6 flex justify-center items-center gap-2 text-sm'
							>
								<Save size={18} /> Salvar Projeto
							</button>
						</form>
					</div>
				</div>
			)}

			{selectedProject && (
				<div className='fixed inset-0 bg-black/95 backdrop-blur-md z-[70] flex items-center justify-center p-4'>
					<div className='bg-[#18181b] border border-white/10 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]'>
						<div className='flex justify-between items-center p-6 border-b border-white/5'>
							<h3 className='font-bold text-xl text-white uppercase'>
								{selectedProject.titulo}
							</h3>
							<button
								onClick={() => setSelectedProject(null)}
								className='text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-800'
							>
								<X size={24} />
							</button>
						</div>

						<div className='overflow-y-auto flex-1 p-8'>
							<div className='grid md:grid-cols-3 gap-8'>
								<div className='md:col-span-1 space-y-6'>
									<div>
										<h4 className='text-[#660099] font-bold mb-2 uppercase tracking-wider text-xs'>
											Objetivos principais
										</h4>
										<p className='text-zinc-300 font-medium leading-relaxed text-sm'>
											{selectedProject.descricao}
										</p>
									</div>
									<div>
										<h4 className='text-[#660099] font-bold mb-3 uppercase tracking-wider text-xs'>
											Tecnologias
										</h4>
										<div className='flex flex-wrap gap-2'>
											{(Array.isArray(selectedProject.tecnologias)
												? selectedProject.tecnologias
												: []
											).map((t, idx) => (
												<span
													key={idx}
													className='text-[10px] uppercase bg-[#660099]/10 text-white px-2 py-1 rounded border border-[#660099]/30 font-bold tracking-wider'
												>
													{t}
												</span>
											))}
										</div>
									</div>
									<div className='flex flex-col gap-3 pt-4'>
										{selectedProject.github && (
											<a
												href={selectedProject.github}
												target='_blank'
												rel='noreferrer'
												className='px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-md font-bold transition-all text-zinc-300 text-center text-xs'
											>
												Ver no GitHub
											</a>
										)}
										{selectedProject.link && (
											<a
												href={selectedProject.link}
												target='_blank'
												rel='noreferrer'
												className='px-4 py-2 bg-[#660099] hover:bg-[#550088] rounded-md font-bold transition-all text-white shadow-lg text-center text-xs'
											>
												Acessar Projeto
											</a>
										)}
									</div>
								</div>

								<div className='md:col-span-2 space-y-6'>
									{selectedProject.imageUrl && (
										<div className='rounded-lg overflow-hidden border border-white/5 bg-zinc-900 shadow-xl'>
											<img
												src={selectedProject.imageUrl}
												className='w-full object-contain max-h-[400px]'
												alt='Capa'
											/>
										</div>
									)}
									{selectedProject.contentImages?.length > 0 && (
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
											{selectedProject.contentImages.map((img, idx) => (
												<div
													key={idx}
													className='rounded-lg overflow-hidden border border-white/5 bg-zinc-900 shadow-xl'
												>
													<img
														src={img}
														className='w-full object-cover aspect-video hover:scale-105 transition-transform duration-500'
														alt={`Detalhe ${idx + 1}`}
													/>
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
