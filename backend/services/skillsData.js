/**
 * Curated Skills Taxonomy
 * Comprehensive categorized taxonomy of technical and soft skills
 * with accurate alias and boundary matching.
 */

const SKILLS_TAXONOMY = [
  // --- Programming Languages ---
  {
    name: 'JavaScript',
    category: 'Programming Languages',
    regex: /\b(javascript|es6|es20\d\d)\b/i
  },
  {
    name: 'TypeScript',
    category: 'Programming Languages',
    regex: /\b(typescript|ts)\b/i
  },
  {
    name: 'Python',
    category: 'Programming Languages',
    regex: /\bpython(3)?\b/i
  },
  {
    name: 'Java',
    category: 'Programming Languages',
    regex: /\bjava\b(?!script)/i
  },
  {
    name: 'C++',
    category: 'Programming Languages',
    regex: /(?:^|[\s,;/()|])(c\+\+|cpp)(?=[\s,;/()|.]|$)/i
  },
  {
    name: 'C#',
    category: 'Programming Languages',
    regex: /(?:^|[\s,;/()|])(c#|csharp)(?=[\s,;/()|.]|$)/i
  },
  {
    name: 'Go',
    category: 'Programming Languages',
    regex: /\b(golang|go\s+language)\b|\bgo\b(?=\s*[,/&|]|\s+(?:developer|engineer|backend|programming))/i
  },
  {
    name: 'Rust',
    category: 'Programming Languages',
    regex: /\b(rust|rustlang)\b/i
  },
  {
    name: 'Ruby',
    category: 'Programming Languages',
    regex: /\bruby\b/i
  },
  {
    name: 'PHP',
    category: 'Programming Languages',
    regex: /\bphp(7|8)?\b/i
  },
  {
    name: 'Swift',
    category: 'Programming Languages',
    regex: /\bswift\b/i
  },
  {
    name: 'Kotlin',
    category: 'Programming Languages',
    regex: /\bkotlin\b/i
  },
  {
    name: 'SQL',
    category: 'Programming Languages',
    regex: /\bsql\b/i
  },
  {
    name: 'HTML/CSS',
    category: 'Programming Languages',
    regex: /\b(html5?|css3?|html\s*\/\s*css)\b/i
  },
  {
    name: 'Bash / Shell',
    category: 'Programming Languages',
    regex: /\b(bash|shell\s+scripting|zsh|powershell)\b/i
  },
  {
    name: 'R',
    category: 'Programming Languages',
    regex: /\b(r\s+language|r\s+programming)\b|\br\b(?=\s*[,/|&]\s*(?:python|sas|spss|stats))/i
  },
  {
    name: 'Scala',
    category: 'Programming Languages',
    regex: /\bscala\b/i
  },
  {
    name: 'Dart',
    category: 'Programming Languages',
    regex: /\bdart\b/i
  },

  // --- Frameworks & Libraries ---
  {
    name: 'React',
    category: 'Frameworks & Libraries',
    regex: /\breact(\.js|js)?\b/i
  },
  {
    name: 'Vue.js',
    category: 'Frameworks & Libraries',
    regex: /\bvue(\.js|js)?\b/i
  },
  {
    name: 'Angular',
    category: 'Frameworks & Libraries',
    regex: /\bangular(js|\.js)?\b/i
  },
  {
    name: 'Next.js',
    category: 'Frameworks & Libraries',
    regex: /\bnext(\.js|js)?\b/i
  },
  {
    name: 'Node.js',
    category: 'Frameworks & Libraries',
    regex: /\bnode(\.js|js)?\b/i
  },
  {
    name: 'Express.js',
    category: 'Frameworks & Libraries',
    regex: /\bexpress(\.js|js)?\b/i
  },
  {
    name: 'Django',
    category: 'Frameworks & Libraries',
    regex: /\bdjango\b/i
  },
  {
    name: 'Flask',
    category: 'Frameworks & Libraries',
    regex: /\bflask\b/i
  },
  {
    name: 'FastAPI',
    category: 'Frameworks & Libraries',
    regex: /\bfastapi\b/i
  },
  {
    name: 'Spring Boot',
    category: 'Frameworks & Libraries',
    regex: /\b(spring\s*boot|spring\s*framework)\b/i
  },
  {
    name: '.NET',
    category: 'Frameworks & Libraries',
    regex: /(?:^|[\s,;/()|])(\.net|dotnet|asp\.net)(?=[\s,;/()|.]|$)/i
  },
  {
    name: 'Ruby on Rails',
    category: 'Frameworks & Libraries',
    regex: /\b(rails|ruby\s+on\s+rails)\b/i
  },
  {
    name: 'Laravel',
    category: 'Frameworks & Libraries',
    regex: /\blaravel\b/i
  },
  {
    name: 'Flutter',
    category: 'Frameworks & Libraries',
    regex: /\bflutter\b/i
  },
  {
    name: 'React Native',
    category: 'Frameworks & Libraries',
    regex: /\breact\s+native\b/i
  },
  {
    name: 'Tailwind CSS',
    category: 'Frameworks & Libraries',
    regex: /\btailwind(\s*css)?\b/i
  },
  {
    name: 'Bootstrap',
    category: 'Frameworks & Libraries',
    regex: /\bbootstrap\b/i
  },
  {
    name: 'GraphQL',
    category: 'Frameworks & Libraries',
    regex: /\bgraphql\b/i
  },
  {
    name: 'REST API',
    category: 'Frameworks & Libraries',
    regex: /\b(restful|rest\s+api[s]?|rest\s+web\s+services)\b/i
  },
  {
    name: 'Redux',
    category: 'Frameworks & Libraries',
    regex: /\bredux(\s*toolkit)?\b/i
  },

  // --- Cloud & DevOps ---
  {
    name: 'AWS',
    category: 'Cloud & DevOps',
    regex: /\b(aws|amazon\s+web\s+services|ec2|s3|lambda|rds|cloudfront)\b/i
  },
  {
    name: 'Microsoft Azure',
    category: 'Cloud & DevOps',
    regex: /\b(azure|microsoft\s+azure)\b/i
  },
  {
    name: 'Google Cloud (GCP)',
    category: 'Cloud & DevOps',
    regex: /\b(gcp|google\s+cloud(\s+platform)?)\b/i
  },
  {
    name: 'Docker',
    category: 'Cloud & DevOps',
    regex: /\bdocker\b/i
  },
  {
    name: 'Kubernetes',
    category: 'Cloud & DevOps',
    regex: /\b(kubernetes|k8s)\b/i
  },
  {
    name: 'Terraform',
    category: 'Cloud & DevOps',
    regex: /\bterraform\b/i
  },
  {
    name: 'CI/CD',
    category: 'Cloud & DevOps',
    regex: /\b(ci[\s/-]?cd|continuous\s+integration|continuous\s+deployment)\b/i
  },
  {
    name: 'GitHub Actions',
    category: 'Cloud & DevOps',
    regex: /\bgithub\s+actions\b/i
  },
  {
    name: 'Jenkins',
    category: 'Cloud & DevOps',
    regex: /\bjenkins\b/i
  },
  {
    name: 'Linux',
    category: 'Cloud & DevOps',
    regex: /\b(linux|ubuntu|centos|debian|redhat)\b/i
  },
  {
    name: 'Nginx',
    category: 'Cloud & DevOps',
    regex: /\bnginx\b/i
  },
  {
    name: 'Ansible',
    category: 'Cloud & DevOps',
    regex: /\bansible\b/i
  },

  // --- Databases & Storage ---
  {
    name: 'PostgreSQL',
    category: 'Databases',
    regex: /\b(postgres(ql)?)\b/i
  },
  {
    name: 'MySQL',
    category: 'Databases',
    regex: /\bmysql\b/i
  },
  {
    name: 'MongoDB',
    category: 'Databases',
    regex: /\bmongo(db)?\b/i
  },
  {
    name: 'Redis',
    category: 'Databases',
    regex: /\bredis\b/i
  },
  {
    name: 'SQLite',
    category: 'Databases',
    regex: /\bsqlite(3)?\b/i
  },
  {
    name: 'DynamoDB',
    category: 'Databases',
    regex: /\bdynamodb\b/i
  },
  {
    name: 'Elasticsearch',
    category: 'Databases',
    regex: /\belasticsearch\b/i
  },
  {
    name: 'Snowflake',
    category: 'Databases',
    regex: /\bsnowflake\b/i
  },
  {
    name: 'BigQuery',
    category: 'Databases',
    regex: /\bbigquery\b/i
  },
  {
    name: 'Firebase',
    category: 'Databases',
    regex: /\bfirebase(\s*(firestore|auth))?\b/i
  },
  {
    name: 'Supabase',
    category: 'Databases',
    regex: /\bsupabase\b/i
  },

  // --- Data & AI ---
  {
    name: 'Machine Learning',
    category: 'Data & AI',
    regex: /\b(machine\s+learning|ml)\b/i
  },
  {
    name: 'Deep Learning',
    category: 'Data & AI',
    regex: /\bdeep\s+learning\b/i
  },
  {
    name: 'Generative AI / LLMs',
    category: 'Data & AI',
    regex: /\b(generative\s+ai|genai|llm[s]?|large\s+language\s+model[s]?|chatgpt|openai|anthropic|claude|gemini)\b/i
  },
  {
    name: 'PyTorch',
    category: 'Data & AI',
    regex: /\bpytorch\b/i
  },
  {
    name: 'TensorFlow',
    category: 'Data & AI',
    regex: /\btensorflow\b/i
  },
  {
    name: 'Scikit-Learn',
    category: 'Data & AI',
    regex: /\b(scikit[\s-]?learn|sklearn)\b/i
  },
  {
    name: 'Pandas',
    category: 'Data & AI',
    regex: /\bpandas\b/i
  },
  {
    name: 'NumPy',
    category: 'Data & AI',
    regex: /\bnumpy\b/i
  },
  {
    name: 'NLP',
    category: 'Data & AI',
    regex: /\b(nlp|natural\s+language\s+processing)\b/i
  },
  {
    name: 'Computer Vision',
    category: 'Data & AI',
    regex: /\b(computer\s+vision|opencv)\b/i
  },
  {
    name: 'RAG',
    category: 'Data & AI',
    regex: /\b(rag|retrieval[\s-]augmented\s+generation)\b/i
  },
  {
    name: 'LangChain',
    category: 'Data & AI',
    regex: /\blangchain\b/i
  },
  {
    name: 'Apache Spark',
    category: 'Data & AI',
    regex: /\b(apache\s+spark|pyspark|spark)\b/i
  },
  {
    name: 'Apache Kafka',
    category: 'Data & AI',
    regex: /\b(apache\s+kafka|kafka)\b/i
  },

  // --- Developer Tools & Testing ---
  {
    name: 'Git',
    category: 'Tools',
    regex: /\bgit\b(?!hub|lab)/i
  },
  {
    name: 'GitHub / GitLab',
    category: 'Tools',
    regex: /\b(github|gitlab|bitbucket)\b/i
  },
  {
    name: 'Jira',
    category: 'Tools',
    regex: /\bjira\b/i
  },
  {
    name: 'Figma',
    category: 'Tools',
    regex: /\bfigma\b/i
  },
  {
    name: 'Postman',
    category: 'Tools',
    regex: /\bpostman\b/i
  },
  {
    name: 'Unit Testing',
    category: 'Tools',
    regex: /\b(unit\s+testing|jest|mocha|pytest|junit|cypress|playwright|selenium)\b/i
  },
  {
    name: 'Webpack / Vite',
    category: 'Tools',
    regex: /\b(webpack|vite|rollup|parcel)\b/i
  },

  // --- Methodologies & Soft Skills ---
  {
    name: 'Agile / Scrum',
    category: 'Methodologies & Soft Skills',
    regex: /\b(agile|scrum|kanban|sprints)\b/i
  },
  {
    name: 'System Design',
    category: 'Methodologies & Soft Skills',
    regex: /\b(system\s+design|software\s+architecture|distributed\s+systems)\b/i
  },
  {
    name: 'Microservices',
    category: 'Methodologies & Soft Skills',
    regex: /\bmicroservices(\s+architecture)?\b/i
  },
  {
    name: 'Test-Driven Development (TDD)',
    category: 'Methodologies & Soft Skills',
    regex: /\b(tdd|test[\s-]driven\s+development)\b/i
  },
  {
    name: 'Leadership & Mentorship',
    category: 'Methodologies & Soft Skills',
    regex: /\b(leadership|mentoring|mentorship|team\s+lead|technical\s+lead)\b/i
  },
  {
    name: 'Code Review',
    category: 'Methodologies & Soft Skills',
    regex: /\bcode\s+reviews?\b/i
  },
  {
    name: 'Cross-functional Collaboration',
    category: 'Methodologies & Soft Skills',
    regex: /\b(cross[\s-]functional|stakeholder\s+management|collaboration)\b/i
  },
  {
    name: 'Problem Solving',
    category: 'Methodologies & Soft Skills',
    regex: /\b(problem[\s-]solving|analytical\s+thinking|critical\s+thinking)\b/i
  }
];

module.exports = {
  SKILLS_TAXONOMY
};
