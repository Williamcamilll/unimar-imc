document.getElementById("unidade").addEventListener("change", function () {
  const unidade = this.value;
  const labelPeso = document.getElementById("label-peso");
  const labelAltura = document.getElementById("label-altura");

  labelPeso.textContent = unidade === "imperial" ? "Peso (lb):" : "Peso (kg):";
  labelAltura.textContent = unidade === "imperial" ? "Altura (in):" : "Altura (cm):";
});

document.getElementById("form-imc").addEventListener("submit", function (e) {
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

  if (isNaN(peso) || isNaN(altura) || altura <= 0 || peso <= 0) {
    document.getElementById("resultado").textContent = "Insira valores válidos para peso e altura.";
    return;
  }

  const imc = (peso / (altura ** 2)).toFixed(2);
  let mensagem = "";
  let dieta = "";
  let exercicio = "";
  let classeIMC = "";

  if (imc < 18.5) {
    mensagem = "Abaixo do peso";
    dieta = "Inclua alimentos ricos em nutrientes e calorias saudáveis como abacate, castanhas e azeite de oliva.";
    exercicio = "Priorize exercícios de força para ganho de massa muscular.";
    classeIMC = "imc-baixo";
  } else if (imc < 24.9) {
    mensagem = "Peso normal";
    dieta = "Mantenha uma alimentação equilibrada com frutas, legumes, proteínas e carboidratos saudáveis.";
    exercicio = "Continue com uma rotina variada entre cardio e musculação.";
    classeIMC = "imc-normal";
  } else if (imc < 29.9) {
    mensagem = "Sobrepeso";
    dieta = "Reduza a ingestão de alimentos processados e aumente o consumo de fibras e proteínas magras.";
    exercicio = "Priorize atividades aeróbicas como caminhada, corrida ou bicicleta.";
    classeIMC = "imc-sobrepeso";
  } else {
    mensagem = "Obesidade";
    dieta = "Consulte um nutricionista. Evite doces, frituras e prefira alimentos naturais.";
    exercicio = "Comece com atividades leves e frequentes, como caminhadas e pilates.";
    classeIMC = "imc-obesidade";
  }

  let resultadoTexto = `IMC: ${imc} - ${mensagem}`;

  if (!isNaN(metaPeso) && metaPeso > 0) {
    const diferenca = (peso - metaPeso).toFixed(1);
    if (diferenca > 0) {
      resultadoTexto += ` | Faltam perder ${diferenca} kg para atingir sua meta.`;
    } else if (diferenca < 0) {
      resultadoTexto += ` | Faltam ganhar ${Math.abs(diferenca)} kg para atingir sua meta.`;
    } else {
      resultadoTexto += ` | Você já atingiu sua meta de peso!`;
    }
  }

  const resultadoEl = document.getElementById("resultado");
  resultadoEl.textContent = resultadoTexto;
  resultadoEl.className = classeIMC;
  document.getElementById("dieta").textContent = `Dieta recomendada: ${dieta}`;
  document.getElementById("exercicio").textContent = `Exercício recomendado: ${exercicio}`;

  salvarHistorico(peso, altura * 100, imc);
  renderizarHistorico();
});

document.getElementById("limpar-historico").addEventListener("click", function () {
  localStorage.removeItem("historicoIMC");
  renderizarHistorico();
});

document.getElementById("salvar-lembrete").addEventListener("click", function () {
  const lembrete = document.getElementById("lembrete").value.trim();
  if (lembrete) {
    const lembretes = JSON.parse(localStorage.getItem("lembretesIMC")) || [];
    lembretes.push(lembrete);
    localStorage.setItem("lembretesIMC", JSON.stringify(lembretes));
    document.getElementById("lembrete").value = "";
    renderizarLembretes();
  }
});

document.getElementById("salvar-perfil").addEventListener("click", function () {
  const nome = document.getElementById("nome").value.trim();
  const idade = document.getElementById("idade").value.trim();
  const sexo = document.getElementById("sexo").value;
  const perfil = { nome, idade, sexo };
  localStorage.setItem("perfilUsuarioIMC", JSON.stringify(perfil));
  alert("Perfil salvo com sucesso!");
});

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
  historico.push({ data: new Date().toLocaleString(), peso, altura, imc });
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

function renderizarLembretes() {
  const lembretes = JSON.parse(localStorage.getItem("lembretesIMC")) || [];
  const lista = document.getElementById("lista-lembretes");
  lista.innerHTML = "";
  lembretes.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = item;
    const botaoRemover = document.createElement("button");
    botaoRemover.textContent = "Remover";
    botaoRemover.style.marginLeft = "10px";
    botaoRemover.onclick = () => {
      lembretes.splice(index, 1);
      localStorage.setItem("lembretesIMC", JSON.stringify(lembretes));
      renderizarLembretes();
    };
    li.appendChild(botaoRemover);
    lista.appendChild(li);
  });
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
    if (traducoes[idioma][chave]) {
      el.textContent = traducoes[idioma][chave];
    }
  });
}

document.getElementById("idioma").addEventListener("change", function () {
  traduzirInterface(this.value);
});

window.addEventListener("load", () => {
  renderizarHistorico();
  renderizarLembretes();
  carregarPerfil();
  traduzirInterface("pt");
});
