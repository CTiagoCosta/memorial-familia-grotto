import bcrypt from "bcryptjs"

const password = process.argv[2]
if (!password) {
  console.error("Uso: node scripts/hash-family-password.mjs <senha>")
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)
console.log("\nFAMILY_PASSWORD_HASH=" + hash + "\n")
console.log("Copie a linha acima para o .env.local e para as variáveis de ambiente da Vercel.")
