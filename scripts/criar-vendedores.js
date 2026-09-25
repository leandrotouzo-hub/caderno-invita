// Cria (ou atualiza a senha de) contas de vendedores no Firebase Auth.
// Uso:
//   1) No Console Firebase: Configurações do projeto > Contas de serviço > "Gerar nova chave privada"
//      Salve o arquivo JSON baixado como: webapp/serviceAccountKey.json (NUNCA suba isso pro GitHub).
//   2) npm install firebase-admin   (dentro da pasta webapp)
//   3) Edite a lista VENDEDORES abaixo com nome/e-mail/senha de cada um.
//   4) node scripts/criar-vendedores.js
//
// Para tornar alguém administrador (vê o Painel de Acessos), marque admin:true.

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const VENDEDORES = [
  // { nome: "Leandro Touzo", email: "leandro.touzo@gmail.com", senha: "TrocarDepois123!", admin: true },
  // { nome: "Fulano de Tal", email: "fulano@exemplo.com", senha: "SenhaProvisoria123!", admin: false },
];

async function main() {
  if (VENDEDORES.length === 0) {
    console.log("Edite a lista VENDEDORES neste arquivo antes de rodar.");
    return;
  }
  const db = admin.firestore();
  for (const v of VENDEDORES) {
    let user;
    try {
      user = await admin.auth().getUserByEmail(v.email);
      await admin.auth().updateUser(user.uid, { password: v.senha, displayName: v.nome });
      console.log(`Atualizado: ${v.email}`);
    } catch (e) {
      user = await admin.auth().createUser({
        email: v.email,
        password: v.senha,
        displayName: v.nome,
      });
      console.log(`Criado: ${v.email}`);
    }
    if (v.admin) {
      await db.collection("roles").doc(user.uid).set({ role: "admin" });
      console.log(`  -> marcado como admin`);
    }
  }
  console.log("Concluído.");
}

main().catch((e) => { console.error(e); process.exit(1); });
