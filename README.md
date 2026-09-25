# Caderno Interativo de Estudo — Invita (com login e painel de acessos)

Este pacote já está pronto: o HTML do caderno (`public/index.html`), a lógica de
login/registro de acessos (`public/firebase-init.js`), as regras de segurança
(`firestore.rules`) e as 137 mídias (vídeos/áudios/infográficos) organizadas em
`media/`. Faltam só os passos abaixo, que só você pode fazer (exigem login no
Google e no GitHub).

## O que foi decidido
- **Login**: e-mail + senha, via Firebase Authentication. Contas são criadas por
  você (não há cadastro aberto).
- **Registro de acessos**: cada login grava uma sessão no Firestore (quem, quando,
  quanto tempo conectado). Você vê isso no menu **📊 Painel de Acessos**, que só
  aparece para administradores.
- **Hospedagem do site**: Firebase Hosting (grátis).
- **Hospedagem da mídia** (vídeos/áudios/infográficos, ~380MB): GitHub Pages, no
  mesmo repositório, para não depender do Cloud Storage pago do Firebase.

## Passo 1 — Criar o projeto no Firebase
1. Acesse **https://console.firebase.google.com** e clique em "Adicionar projeto".
2. Dê um nome (ex.: `caderno-invita`) e conclua a criação (pode desativar o
   Google Analytics, não é necessário).
3. No menu lateral, vá em **Build > Authentication > Sign-in method** e ative o
   provedor **E-mail/senha**.
4. Vá em **Build > Firestore Database > Criar banco de dados**. Escolha
   **modo de produção** e a região `southamerica-east1` (São Paulo).
5. Vá em **Configurações do projeto** (ícone de engrenagem) > aba **Geral** >
   role até "Seus apps" > clique no ícone `</>` (Web) > dê um apelido (ex.
   `caderno-web`) > **não** marque Firebase Hosting nessa tela > Registrar app.
   Copie o objeto `firebaseConfig` que aparece (apiKey, authDomain, etc.) e me
   envie aqui no chat — eu preencho o `public/firebase-init.js` com esses
   valores.
6. Ainda em Configurações do projeto, aba **Contas de serviço**, clique em
   **Gerar nova chave privada**. Salve o arquivo `.json` baixado como
   `webapp/serviceAccountKey.json` (esse arquivo é secreto — o `.gitignore`
   já está configurado para nunca subir ele pro GitHub).

## Passo 2 — Criar o repositório no GitHub (para hospedar a mídia)
1. Crie um repositório novo no GitHub (pode ser privado ou público — se for
   privado, o GitHub Pages exige plano pago para publicar; se puder deixar
   público, é mais simples e gratuito).
2. Me passe a URL do repositório (ex. `https://github.com/seu-usuario/caderno-invita`)
   — eu configuro o `git remote`, faço o commit de tudo (código + mídia) e
   te aviso quando puder ativar o **GitHub Pages** em
   Settings > Pages > Branch: `main` / pasta `/ (root)` ou `/media` conforme o
   que eu configurar.

## Passo 3 — Instalar as ferramentas de linha de comando (uma vez só)
No seu computador, com Node.js já instalado:
```
npm install -g firebase-tools
```
Depois rode `firebase login` — isso abre o navegador para você entrar com a
conta Google do projeto Firebase. Esse passo eu não consigo fazer por você
(precisa da sua conta).

## Passo 4 — Criar os vendedores (contas de login)
1. Dentro da pasta `webapp/`, rode `npm install` (instala o `firebase-admin`).
2. Abra `scripts/criar-vendedores.js` e preencha a lista `VENDEDORES` com
   nome, e-mail e uma senha provisória de cada vendedor (marque `admin: true`
   só para você mesmo, ou quem mais deva ver o painel de acessos).
3. Rode `npm run criar-vendedores`.
4. Repita esse processo sempre que precisar adicionar, remover ou resetar a
   senha de alguém.

## Passo 5 — Deploy
Depois que você tiver feito os passos 1–4 e eu tiver preenchido o
`firebase-init.js` com sua config real, rodamos juntos:
```
firebase deploy --only hosting,firestore:rules
```
Isso publica o site em algo como `https://caderno-invita.web.app` (dá pra
apontar um domínio próprio depois, em Hosting > Adicionar domínio
personalizado).

## O que eu preciso que você me mande para eu continuar
- [ ] O objeto `firebaseConfig` do Passo 1.5
- [ ] A URL do repositório GitHub do Passo 2
- [ ] Confirmação de que rodou `firebase login` (Passo 3)

Com isso eu termino o deploy, crio seu usuário admin e te devolvo o link
final para compartilhar com a equipe.
