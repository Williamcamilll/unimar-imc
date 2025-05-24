document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("splash").style.display = "none";
  aplicarEventos();
  carregarPerfil();
  renderizarHistorico();
  renderizarLembretes();
  atualizarEstatisticas();
  aplicarTemaSalvo();
  aplicarIdiomaSalvo();
  buscarClimaAtual();
  atualizarRelogio();
  monitorarConexao();
  atualizarGraficoIMC();
});

// =================== EVENTOS ===================
function aplicarEventos() {
  document.getElementById("form-imc").addEventListener("submit", calcularIMC);
  document.getElementById("unidade").addEventListener("change", atualizarUnidade);
  document.getElementById("salvar-perfil").addEventListener("click", salvarPerfil);
  document.getElementById("salvar-lembrete").addEventListener("click", salvarLembrete);
  document.getElementById("limpar-historico").addEventListener("click", limparHistorico);
  document.getElementById("toggle-tema").addEventListener("click", alternarTema);
  document.getElementById("idioma").addEventListener("change", e => {
    localStorage.setItem("idiomaSelecionado", e.target.value);
    traduzirInterface(e.target.value);
  });
}

// ========== RELÓGIO & CONEXÃO ==========
function atualizarRelogio() {
  setInterval(() => {
    const agora = new Date();
    const horario = agora.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
    document.getElementById("horario-brasilia").textContent = `🕒 ${horario} (Brasília)`;
  }, 1000);
}

function monitorarConexao() {
  function atualizarStatus() {
    const status = document.getElementById("status-conexao");
    status.textContent = navigator.onLine ? "🟢 Online" : "🔴 Offline";
  }
  window.addEventListener("online", atualizarStatus);
  window.addEventListener("offline", atualizarStatus);
  atualizarStatus();
}

// ========== CLIMA ==========
function buscarClimaAtual() {
  const climaInfo = document.getElementById("clima-info");
  fetch("https://api.open-meteo.com/v1/forecast?latitude=-22.22&longitude=-49.95&current_weather=true")
    .then(res => res.json())
    .then(dado => {
      const c = dado.current_weather;
      climaInfo.textContent = `🌡️ ${c.temperature}°C | 💨 ${c.windspeed} km/h`;
    })
    .catch(() => climaInfo.textContent = "Erro ao buscar clima.");
}

// ========== DARK MODE ==========
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

// ========== TOAST ==========
function exibirToast(mensagem, erro = false) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast" + (erro ? " erro" : "");
  toast.textContent = mensagem;
  container.appendChild(toast);
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  setTimeout(() => container.removeChild(toast), 4000);
}

// ========== UNIDADE ==========
function atualizarUnidade() {
  const unidade = this.value;
  document.getElementById("peso").placeholder = unidade === "imperial" ? "Peso (lb)" : "Peso (kg)";
  document.getElementById("altura").placeholder = unidade === "imperial" ? "Altura (in)" : "Altura (cm)";
}

// ========== CÁLCULO IMC ==========
function calcularIMC(e) {
  e.preventDefault();
  const unidade = document.getElementById("unidade").value;
  let peso = parseFloat(document.getElementById("peso").value);
  let altura = parseFloat(document.getElementById("altura").value);
  const metaPeso = parseFloat(document.getElementById("meta-peso").value);

  if (unidade === "imperial") {
    peso *= 0.453592;
    altura *= 2.54;
  }
  altura /= 100;

  if (!peso || !altura || peso <= 0 || altura <= 0) {
    return exibirToast("⚠️ Preencha peso e altura corretamente.", true);
  }

  const imc = (peso / (altura ** 2)).toFixed(2);
  const resultado = classificarIMC(imc);
  const texto = `IMC: ${imc} - ${resultado.texto}`;
  document.getElementById("resultado").textContent = texto;
  document.getElementById("resultado").className = resultado.classe;

  document.getElementById("dieta").textContent = resultado.dieta;
  document.getElementById("exercicio").textContent = resultado.exercicio;

  salvarHistorico(peso, altura * 100, imc);
  renderizarHistorico();
  atualizarEstatisticas();
  atualizarGraficoIMC();
}

function classificarIMC(imc) {
  if (imc < 18.5) return { texto: "Abaixo do peso", classe: "imc-baixo", dieta: "Dieta: + calorias saudáveis.", exercicio: "Foco em força." };
  if (imc < 24.9) return { texto: "Peso normal", classe: "imc-normal", dieta: "Dieta: manter equilíbrio.", exercicio: "Cardio + força." };
  if (imc < 29.9) return { texto: "Sobrepeso", classe: "imc-sobrepeso", dieta: "Dieta: reduzir gordura.", exercicio: "Foco em cardio." };
  return { texto: "Obesidade", classe: "imc-obesidade", dieta: "Dieta: nutricionista urgente.", exercicio: "Caminhadas diárias." };
}

// ========== PERFIL & HISTÓRICO ==========
function salvarPerfil() {
  const nome = document.getElementById("nome").value.trim();
  const idade = document.getElementById("idade").value.trim();
  const sexo = document.getElementById("sexo").value;
  localStorage.setItem("perfilUsuarioIMC", JSON.stringify({ nome, idade, sexo }));
  exibirToast("Perfil salvo!");
}

function carregarPerfil() {
  const perfil = JSON.parse(localStorage.getItem("perfilUsuarioIMC"));
  if (perfil) {
    document.getElementById("nome").value = perfil.nome;
    document.getElementById("idade").value = perfil.idade;
    document.getElementById("sexo").value = perfil.sexo;
  }
}

function salvarHistorico(peso, altura, imc) {
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  historico.unshift({ data: new Date().toLocaleString(), peso, altura, imc });
  localStorage.setItem("historicoIMC", JSON.stringify(historico));
}

function renderizarHistorico() {
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  const tbody = document.querySelector("#historico tbody");
  tbody.innerHTML = "";
  historico.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${entry.data}</td><td>${entry.peso}</td><td>${entry.altura}</td><td>${entry.imc}</td>`;
    tbody.appendChild(row);
  });
}

function limparHistorico() {
  if (confirm("Deseja realmente limpar o histórico?")) {
    localStorage.removeItem("historicoIMC");
    renderizarHistorico();
    atualizarEstatisticas();
    atualizarGraficoIMC();
  }
}

// ========== LEMBRETES ==========
function salvarLembrete() {
  const lembrete = document.getElementById("lembrete").value.trim();
  if (!lembrete) return;
  const lembretes = JSON.parse(localStorage.getItem("lembretesIMC")) || [];
  lembretes.push(lembrete);
  localStorage.setItem("lembretesIMC", JSON.stringify(lembretes));
  document.getElementById("lembrete").value = "";
  renderizarLembretes();
  atualizarEstatisticas();
}

function renderizarLembretes() {
  const lembretes = JSON.parse(localStorage.getItem("lembretesIMC")) || [];
  const lista = document.getElementById("lista-lembretes");
  lista.innerHTML = "";
  lembretes.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = item;
    const botao = document.createElement("button");
    botao.textContent = "Remover";
    botao.onclick = () => {
      lembretes.splice(index, 1);
      localStorage.setItem("lembretesIMC", JSON.stringify(lembretes));
      renderizarLembretes();
      atualizarEstatisticas();
    };
    li.appendChild(botao);
    lista.appendChild(li);
  });
}

// ========== ESTATÍSTICAS ==========
function atualizarEstatisticas() {
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  const lembretes = JSON.parse(localStorage.getItem("lembretesIMC")) || [];
  document.getElementById("stat-calculos").textContent = `Cálculos realizados: ${historico.length}`;
  document.getElementById("stat-lembretes").textContent = `Lembretes ativos: ${lembretes.length}`;
}

// ========== GRÁFICO ==========
function atualizarGraficoIMC() {
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  const labels = historico.map(e => e.data).reverse();
  const dados = historico.map(e => e.imc).reverse();
  const ctx = document.getElementById("graficoIMC")?.getContext("2d");
  if (!ctx) return;
  if (window.graficoIMC) window.graficoIMC.destroy();
  window.graficoIMC = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "IMC",
        data: dados,
        borderColor: "#0072ce",
        backgroundColor: "rgba(0, 114, 206, 0.1)",
        tension: 0.3,
        fill: true,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#0072ce",
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { suggestedMin: 15, suggestedMax: 40 }
      }
    }
  });
}

// ========== IDIOMA ==========
function aplicarIdiomaSalvo() {
  const idioma = localStorage.getItem("idiomaSelecionado") || "pt";
  document.getElementById("idioma").value = idioma;
  traduzirInterface(idioma);
}

function traduzirInterface(idioma) {
  const traducoes = {
    pt: {
      titulo: "Calculadora de IMC",
      subtitulo: "Projeto Engenharia de Software - ADS | Unimar",
      perfil: "Perfil do Usuário",
      nome: "Nome:",
      idade: "Idade:",
      sexo: "Sexo:",
      salvarPerfil: "Salvar Perfil",
      peso: "Peso:",
      altura: "Altura:",
      meta: "Meta de Peso:",
      calcular: "Calcular IMC",
      recomendacoes: "Recomendações Personalizadas",
      faixas: "Faixas de IMC",
      classificacao: "Classificação",
      abaixo: "Abaixo do peso",
      normal: "Peso normal",
      sobrepeso: "Sobrepeso",
      obesidade: "Obesidade",
      historico: "Histórico de Cálculos",
      data: "Data",
      limpar: "Limpar Histórico",
      lembretes: "Lembretes",
      escreva: "Escreva um lembrete:",
      salvarLembrete: "Salvar Lembrete"
    },
    en: {
      titulo: "BMI Calculator",
      subtitulo: "Software Engineering Project - ADS | Unimar",
      perfil: "User Profile",
      nome: "Name:",
      idade: "Age:",
      sexo: "Gender:",
      salvarPerfil: "Save Profile",
      peso: "Weight:",
      altura: "Height:",
      meta: "Weight Goal:",
      calcular: "Calculate BMI",
      recomendacoes: "Personalized Recommendations",
      faixas: "BMI Ranges",
      classificacao: "Classification",
      abaixo: "Underweight",
      normal: "Normal weight",
      sobrepeso: "Overweight",
      obesidade: "Obesity",
      historico: "Calculation History",
      data: "Date",
      limpar: "Clear History",
      lembretes: "Reminders",
      escreva: "Write a reminder:",
      salvarLembrete: "Save Reminder"
    },
    es: {
      titulo: "Calculadora de IMC",
      subtitulo: "Proyecto de Ingeniería de Software - ADS | Unimar",
      perfil: "Perfil del Usuario",
      nome: "Nombre:",
      idade: "Edad:",
      sexo: "Sexo:",
      salvarPerfil: "Guardar Perfil",
      peso: "Peso:",
      altura: "Altura:",
      meta: "Meta de Peso:",
      calcular: "Calcular IMC",
      recomendacoes: "Recomendaciones Personalizadas",
      faixas: "Rangos de IMC",
      classificacao: "Clasificación",
      abaixo: "Bajo peso",
      normal: "Peso normal",
      sobrepeso: "Sobrepeso",
      obesidade: "Obesidad",
      historico: "Historial de Cálculos",
      data: "Fecha",
      limpar: "Limpiar Historial",
      lembretes: "Recordatorios",
      escreva: "Escribe un recordatorio:",
      salvarLembrete: "Guardar Recordatorio"
    },
    zh: {
      titulo: "BMI计算器",
      subtitulo: "软件工程项目 - ADS | Unimar",
      perfil: "用户资料",
      nome: "姓名:",
      idade: "年龄:",
      sexo: "性别:",
      salvarPerfil: "保存资料",
      peso: "体重:",
      altura: "身高:",
      meta: "目标体重:",
      calcular: "计算BMI",
      recomendacoes: "个性化建议",
      faixas: "BMI范围",
      classificacao: "分类",
      abaixo: "体重过轻",
      normal: "正常体重",
      sobrepeso: "超重",
      obesidade: "肥胖",
      historico: "计算历史",
      data: "日期",
      limpar: "清除历史",
      lembretes: "提醒事项",
      escreva: "写下一个提醒:",
      salvarLembrete: "保存提醒"
    }
  };

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const chave = el.getAttribute("data-i18n");
    if (traducoes[idioma] && traducoes[idioma][chave]) {
      el.textContent = traducoes[idioma][chave];
    }
  });
}
