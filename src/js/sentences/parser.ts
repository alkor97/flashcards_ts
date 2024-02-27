import { DataEntry } from "../repository";

interface GPerson {
  person: number;
}

type GNumberType = "singular" | "plural";

interface GNumber {
  number: GNumberType;
}

type GGenderType = "masculine" | "feminine" | undefined;
interface GGender {
  gender: GGenderType;
  keyGender: GGenderType;
}

interface Base {
  key: string;
  value: string;
}

export interface Subject extends Base, GNumber, GPerson, GGender {
  type: "subject";
}
export interface SubjectMatchable extends Base {
  matches: (subject: Subject) => boolean;
  keyMatches: (Subject: Subject) => boolean;
}

interface Verb extends Base, GNumber, GPerson, SubjectMatchable {
  type: "verb";
}

interface NumberAndGender extends Base, GNumber, GGender, SubjectMatchable {}
export interface NumberAndGenderAndPerson extends NumberAndGender, GPerson {}
type NounSubTypes = "" | "proper";
interface Noun extends NumberAndGenderAndPerson {
  type: "noun";
  subType: NounSubTypes;
  person: 3;
}
interface Article extends NumberAndGender {
  type: "article";
}
interface Adjective extends NumberAndGender {
  type: "adjective";
}
type PronounSubTypes = "personal" | "possessive" | "demonstrative";
interface Pronoun extends NumberAndGenderAndPerson {
  type: "pronoun";
  subType: PronounSubTypes;
}

function parsePerson(entry: DataEntry): number {
  if (entry.tags.includes("1st")) {
    return 1;
  } else if (entry.tags.includes("2nd")) {
    return 2;
  } else if (entry.tags.includes("3rd")) {
    return 3;
  }
  throw new Error(`Unable to parse number!`);
}

function parseNumber(entry: DataEntry): GNumberType {
  if (entry.tags.includes("singular")) {
    return "singular";
  } else if (entry.tags.includes("plural")) {
    return "plural";
  }
  throw new Error(`Unable to parse person!`);
}

function parseGender(entry: DataEntry): GGenderType {
  if (entry.tags.includes("masculine")) {
    return "masculine";
  } else if (entry.tags.includes("feminine")) {
    return "feminine";
  }
  return undefined;
}

function parseKeyGender(entry: DataEntry): GGenderType {
  if (entry.tags.includes("key-masculine")) {
    return "masculine";
  } else if (entry.tags.includes("key-feminine")) {
    return "feminine";
  }
  return parseGender(entry);
}

function parsePersonAndGender(entry: DataEntry): NumberAndGender {
  return {
    key: entry.key,
    value: entry.value,
    gender: parseGender(entry),
    keyGender: parseKeyGender(entry),
    number: parseNumber(entry),
    matches(subject) {
      return (
        (!subject.gender || this.gender === subject.gender) &&
        this.number === subject.number
      );
    },
    keyMatches(subject) {
      return (
        (!subject.keyGender || this.keyGender === subject.keyGender) &&
        this.number === subject.number
      );
    },
  };
}

function parsePronounSubType(entry: DataEntry): PronounSubTypes {
  if (entry.tags.includes("personal")) {
    return "personal";
  } else if (entry.tags.includes("possessive")) {
    return "possessive";
  } else if (entry.tags.includes("demonstrative")) {
    return "demonstrative";
  }
  throw new Error("Unable to parse pronoun subtype!");
}

export interface Repository {
  verbs: Verb[];
  articles: Article[];
  adjectives: Adjective[];
  nouns: Noun[];
  pronouns: Pronoun[];
}

export function parseGrammarElements(entries: DataEntry[]): Repository {
  const repo: Repository = {
    verbs: [],
    articles: [],
    adjectives: [],
    nouns: [],
    pronouns: [],
  };
  for (const entry of entries) {
    try {
      if (entry.tags.includes("verb")) {
        repo.verbs.push({
          key: entry.key,
          value: entry.value,
          number: parseNumber(entry),
          person: parsePerson(entry),
          type: "verb",
          matches(subject) {
            return (
              this.number === subject.number && this.person === subject.person
            );
          },
          keyMatches(subject) {
            return this.matches(subject);
          },
        });
      } else if (entry.tags.includes("adjective")) {
        repo.adjectives.push({
          ...parsePersonAndGender(entry),
          type: "adjective",
        });
      } else if (entry.tags.includes("article")) {
        repo.articles.push({
          ...parsePersonAndGender(entry),
          key: "",
          type: "article",
        });
      } else if (entry.tags.includes("noun")) {
        repo.nouns.push({
          ...parsePersonAndGender(entry),
          type: "noun",
          person: 3,
          subType: entry.tags.includes("proper") ? "proper" : "",
        });
      } else if (entry.tags.includes("pronoun")) {
        repo.pronouns.push({
          key: entry.key,
          value: entry.value,
          type: "pronoun",
          subType: parsePronounSubType(entry),
          person: parsePerson(entry),
          gender: parseGender(entry),
          keyGender: parseKeyGender(entry),
          number: parseNumber(entry),
          matches(subject) {
            return (
              (!subject.gender || this.gender === subject.gender) &&
              this.person === subject.person &&
              this.number === subject.number
            );
          },
          keyMatches(subject) {
            return (
              (!subject.keyGender || this.keyGender === subject.keyGender) &&
              this.person === subject.person &&
              this.number === subject.number
            );
          },
        });
      }
    } catch (e) {
      throw new Error(`Error while parsing "${JSON.stringify(entry)}}": ${e}`);
    }
  }
  return repo;
}
