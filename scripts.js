// ===============================
//        CONFIGURAÇÕES INICIAIS
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  aplicarEventos();
  carregarPerfil();
  renderizarHistorico();
  renderizarLembretes();
  aplicarIdiomaSalvo();
  aplicarTemaSalvo();
  buscarClimaAtual();
});

function aplicarEventos() {
  document.getElementById("unidade").addEventListener("change", atualizarUnidade);
  document.getElementById("form-imc").addEventListener("submit", calcularIMC);
  document.getElementById("limpar-historico").addEventListener("click", limparHistorico);
  document.getElementById("exportar-pdf").addEventListener("click", exportarPDF);
  document.getElementById("salvar-lembrete").addEventListener("click", salvarLembrete);
  document.getElementById("salvar-perfil").addEventListener("click", salvarPerfil);
  document.getElementById("idioma").addEventListener("change", e => {
    localStorage.setItem("idiomaSelecionado", e.target.value);
    traduzirInterface(e.target.value);
  });
  document.getElementById("toggle-tema").addEventListener("click", alternarTema);
  document.getElementById("iniciar-pomodoro").addEventListener("click", iniciarPomodoro);
  document.getElementById("parar-pomodoro").addEventListener("click", pararPomodoro);
}

function atualizarUnidade() {
  const unidade = document.getElementById("unidade").value;
  document.getElementById("label-peso").textContent = unidade === "imperial" ? "Peso (lb):" : "Peso (kg):";
  document.getElementById("label-altura").textContent = unidade === "imperial" ? "Altura (in):" : "Altura (cm):";
}

function mostrarToast(msg, tipo = "sucesso") {
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.textContent = msg;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function buscarClimaAtual() {
  fetch("https://api.weatherapi.com/v1/current.json?key=SUA_API_KEY&q=auto:ip&lang=pt")
    .then(res => res.json())
    .then(dados => {
      const info = `${dados.location.name}: ${dados.current.temp_c}°C, ${dados.current.condition.text}`;
      document.getElementById("clima").textContent = info;
    })
    .catch(() => document.getElementById("clima").textContent = "Não foi possível carregar o clima.");
}

let intervaloPomodoro;
let tempoRestante = 1500;

function iniciarPomodoro() {
  intervaloPomodoro = setInterval(() => {
    if (tempoRestante <= 0) {
      clearInterval(intervaloPomodoro);
      mostrarToast("Pomodoro finalizado!", "sucesso");
      return;
    }
    tempoRestante--;
    const minutos = String(Math.floor(tempoRestante / 60)).padStart(2, '0');
    const segundos = String(tempoRestante % 60).padStart(2, '0');
    document.getElementById("pomodoro-tempo").textContent = `${minutos}:${segundos}`;
  }, 1000);
}

function pararPomodoro() {
  clearInterval(intervaloPomodoro);
  tempoRestante = 1500;
  document.getElementById("pomodoro-tempo").textContent = "25:00";
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Histórico de IMC", 10, 10);
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  historico.slice(0, 20).forEach((item, i) => {
    doc.text(`${item.data} - Peso: ${item.peso}kg, Altura: ${item.altura}cm, IMC: ${item.imc}`, 10, 20 + (i * 10));
  });
  doc.save("historico_imc.pdf");
}

function atualizarProgressoMeta(peso, metaPeso) {
  if (!metaPeso || metaPeso <= 0) return;
  const progresso = Math.min(100, Math.abs(((peso - metaPeso) / peso) * 100));
  document.getElementById("barra-progresso").value = progresso;
}

function calcularEstatisticas() {
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  if (!historico.length) return;
  const imcs = historico.map(e => parseFloat(e.imc));
  const total = imcs.length;
  const media = (imcs.reduce((a, b) => a + b, 0) / total).toFixed(2);
  const min = Math.min(...imcs).toFixed(2);
  const max = Math.max(...imcs).toFixed(2);

  const perfil = JSON.parse(localStorage.getItem("perfilUsuarioIMC"));
  const meta = parseFloat(document.getElementById("meta-peso").value);
  const atingidas = historico.filter(e => Math.abs(e.peso - meta) < 0.5).length;

  document.getElementById("total-registros").textContent = total;
  document.getElementById("media-imc").textContent = media;
  document.getElementById("imc-min").textContent = min;
  document.getElementById("imc-max").textContent = max;
  document.getElementById("metas-alcancadas").textContent = `${((atingidas / total) * 100).toFixed(1)}%`;
}

function aplicarIdiomaSalvo() {
  const idioma = localStorage.getItem("idiomaSelecionado") || "pt";
  document.getElementById("idioma").value = idioma;
  traduzirInterface(idioma);
}

function aplicarTemaSalvo() {
  const tema = localStorage.getItem("temaIMC") || "light";
  document.documentElement.setAttribute("data-tema", tema);
}

function alternarTema() {
  const root = document.documentElement;
  const temaAtual = root.getAttribute("data-tema") || "light";
  const novoTema = temaAtual === "light" ? "dark" : "light";
  root.setAttribute("data-tema", novoTema);
  localStorage.setItem("temaIMC", novoTema);
}

function traduzirInterface(idioma) {
  const traducoes = {
    pt: {
      titulo: "Calculadora de IMC",
      subtitulo: "Projeto Engenharia de Software - ADS | Unimar",
      perfil: "Perfil do Usuário",
      nome: "Nome:", idade: "Idade:", sexo: "Sexo:", salvarPerfil: "Salvar Perfil",
      peso: "Peso (kg):", altura: "Altura (cm):", meta: "Meta de Peso (kg):",
      calcular: "Calcular IMC", recomendacoes: "Recomendações Personalizadas",
      faixas: "Faixas de IMC", classificacao: "Classificação",
      abaixo: "Abaixo do peso", normal: "Peso normal",
      sobrepeso: "Sobrepeso", obesidade: "Obesidade",
      historico: "Histórico de Cálculos", data: "Data", limpar: "Limpar Histórico",
      lembretes: "Lembretes Personalizados", escreva: "Escreva um lembrete:", salvarLembrete: "Salvar Lembrete"
    },
    en: {
      titulo: "BMI Calculator", subtitulo: "Software Engineering Project - ADS | Unimar",
      perfil: "User Profile", nome: "Name:", idade: "Age:", sexo: "Gender:", salvarPerfil: "Save Profile",
      peso: "Weight (kg):", altura: "Height (cm):", meta: "Weight Goal (kg):",
      calcular: "Calculate BMI", recomendacoes: "Personalized Recommendations",
      faixas: "BMI Ranges", classificacao: "Classification",
      abaixo: "Underweight", normal: "Normal weight",
      sobrepeso: "Overweight", obesidade: "Obesity",
      historico: "Calculation History", data: "Date", limpar: "Clear History",
      lembretes: "Personal Reminders", escreva: "Write a reminder:", salvarLembrete: "Save Reminder"
    }
  };
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const chave = el.getAttribute("data-i18n");
    if (traducoes[idioma][chave]) el.textContent = traducoes[idioma][chave];
  });
}
