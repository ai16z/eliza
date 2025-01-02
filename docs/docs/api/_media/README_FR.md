# Eliza

<img src="./docs/static/img/eliza_banner.jpg" alt="Eliza Banner" width="100%" />

## la fonctionnalité

- 🛠 soutenir la connexion discord/ twitter /telegram
- 👥 soutien aux agents multimodaux
- 📚 simple à importer des documents et interagir avec les documents
- mémoire et stockage des documents accessibles
- 🚀 haute scalabilité, vous pouvez personnaliser les clients et les comportements pour une extension fonctionnelle
- ☁ ️ plusieurs modèles, y compris Llama, OpenAI Grok Anthropic, etc.
- 📦 simple et facile à utiliser

Que pouvez-vous faire avec Eliza?

- 🤖 le chatbot
- 🕵 ️ Agents autonomes
- 📈 processus métier pour automatiser le traitement
- 🎮 jeux PNJ

# commencez à utiliser

**pré-requis (obligatoire) :**

- [Node.js 22+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- installation Nodejs
- [pnpm](https://pnpm.io/installation)
- travailler avec PNPM

### éditer le fichier.env

- copiez.env.example en.env et remplissez la valeur appropriée
- modifier l’environnement twitter et entrer votre compte twitter et mot de passe

### modifier les fichiers de rôles

- voir le document `src/core/defaultCharacter ts` - vous pouvez le modifier
- vous pouvez également utiliser `node --loader ts-node/esm src/index.ts --characters="path/to/your/character.json" ` et simultanément plusieurs robots.

Après avoir terminé la configuration des fichiers de compte et de rôle, lancez votre bot en tapant la ligne de commande suivante:

```
pnpm i
pnpm start
```

# personnalisez votre Eliza

### ajouter un comportement régulier

Pour éviter les conflits Git dans le répertoire core, nous vous recommandons d’ajouter les actions personnalisées dans le répertoire custom_actions et de les configurer dans le fichier elizaconfig.yaml. Vous pouvez consulter l’exemple dans le fichier elizaconfig.example.yaml.

## configurez différents grands modèles

### configurer Llama

Vous pouvez exécuter en définissant la variable d’environnement `XAI_MODEL` à `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` ou `meta-llama/Meta-Llama-3.1-405B-Instruct` Llama 70B ou 405B modèle

### configurer OpenAI

Vous pouvez exécuter le modèle OpenAI en définissant la variable d’environnement `XAI_MODEL` à `gpt-4o-mini` ou `gpt-4o`

## autres demandes

Vous devrez peut-être installer Sharp. Si vous voyez une erreur au démarrage, essayez d’installer avec la commande suivante:

```
pnpm install --include=optional sharp
```

# paramètres de l’environnement

Vous devez ajouter des variables d’environnement à votre fichier.env pour vous connecter à différentes plates-formes:

```
# Required environment variables
DISCORD_APPLICATION_ID=
DISCORD_API_TOKEN= # Bot token
OPENAI_API_KEY=sk-* # OpenAI API key, starting with sk-
ELEVENLABS_XI_API_KEY= # API key from elevenlabs

# ELEVENLABS SETTINGS
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_VOICE_STABILITY=0.5
ELEVENLABS_VOICE_SIMILARITY_BOOST=0.9
ELEVENLABS_VOICE_STYLE=0.66
ELEVENLABS_VOICE_USE_SPEAKER_BOOST=false
ELEVENLABS_OPTIMIZE_STREAMING_LATENCY=4
ELEVENLABS_OUTPUT_FORMAT=pcm_16000

TWITTER_DRY_RUN=false
TWITTER_USERNAME= # Account username
TWITTER_PASSWORD= # Account password
TWITTER_EMAIL= # Account email

TWITTER_API_IO_KEY=elizaOS_public_key_love_truth_future
# Accédez aux données Twitter sans connexion ni proxy, en évitant les restrictions #de compte et les limites de taux.
# Une clé API Twitter tierce pour la récupération de données à haut volume.
# Cette clé partagée est uniquement destinée aux tests.
# Obtenez votre clé personnelle sur https://twitterapi.io pour éviter les #limitations de QPS

X_SERVER_URL=
XAI_API_KEY=
XAI_MODEL=


# For asking Claude stuff
ANTHROPIC_API_KEY=

# EVM
EVM_PRIVATE_KEY=EXAMPLE_WALLET_PRIVATE_KEY

# Solana
SOLANA_PRIVATE_KEY=EXAMPLE_WALLET_PRIVATE_KEY
SOLANA_PUBLIC_KEY=EXAMPLE_WALLET_PUBLIC_KEY

# Fallback Wallet Configuration (deprecated)
WALLET_PRIVATE_KEY=EXAMPLE_WALLET_PRIVATE_KEY
WALLET_PUBLIC_KEY=EXAMPLE_WALLET_PUBLIC_KEY

BIRDEYE_API_KEY=

SOL_ADDRESS=So11111111111111111111111111111111111111112
SLIPPAGE=1
RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=


## Telegram
TELEGRAM_BOT_TOKEN=

TOGETHER_API_KEY=
```

# paramètres locaux

### ensemble CUDA

Si vous avez une carte graphique nvidia haute performance, vous pouvez faire l’accélération locale avec la ligne de commande suivante CUDA

```
pnpm install
npx --no node-llama-cpp source download --gpu cuda
```

Assurez-vous d’avoir le kit complet CUDA installé, y compris cuDNN et cuBLAS

### exécution locale

Ajoutez XAI_MODEL et définissez-le à l’une des options ci-dessus [use Llama run](#run-with-llama)
Vous pouvez laisser X_SERVER_URL et XAI_API_KEY vides, qui téléchargera le modèle de huggingface et le consultera localement

# le client

Pour savoir comment configurer votre bot discord, vous pouvez consulter la documentation officielle de discord

# le développement

## le test

Ligne de commande pour plusieurs méthodes de test:

```bash
pnpm test           # Run tests once
pnpm test:watch    # Run tests in watch mode
```

Pour les tests spécifiques à la base de données:

```bash
pnpm test:sqlite   # Run tests with SQLite
pnpm test:sqljs    # Run tests with SQL.js
```

Les tests sont écrits en Jest et se trouvent dans le fichier SRC /\*_/_.test.ts. L’environnement de test est configuré comme suit:

- chargement des variables d’environnement de.env.test
- utilisez un temps d’attente de 2 minutes pour exécuter des tests de longue durée
- support du module ESM
- exécuter les tests dans l’ordre (--runInBand)

Pour créer un nouveau test, ajoutez un fichier.test.ts à côté du code à tester.
