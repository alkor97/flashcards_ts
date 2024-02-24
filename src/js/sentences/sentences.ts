import { DataEntry } from "../repository";
import { randomInt } from "../random";

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
}

interface Base {
  key: string;
  value: string;
}

interface Subject extends Base, GNumber, GPerson, GGender {}
interface SubjectMatchable extends Base {
  matches: (subject: Subject) => boolean;
}

interface Verb extends Base, GNumber, GPerson, SubjectMatchable {
  type: "verb";
}

interface NumberAndGender extends Base, GNumber, GGender, SubjectMatchable {}
interface NumberAndGenderAndPerson extends NumberAndGender, GPerson {}
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
type PronounSubTypes = "personal" | "possessive";
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

function parsePersonAndGender(entry: DataEntry): NumberAndGender {
  return {
    key: entry.key,
    value: entry.value,
    gender: parseGender(entry),
    number: parseNumber(entry),
    matches(subject) {
      return this.gender === subject.gender && this.number === subject.number;
    },
  };
}

function parsePronounSubType(entry: DataEntry): PronounSubTypes {
  if (entry.tags.includes("personal")) {
    return "personal";
  } else if (entry.tags.includes("possessive")) {
    return "possessive";
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
          number: parseNumber(entry),
          matches(subject) {
            return (
              this.person === subject.person &&
              this.gender === subject.gender &&
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

function randomFrom<T>(array: T[]): T {
  return array[randomInt(array.length)];
}

// function randomSubject(repo: Repository): Subject {
//   const source = randomFrom([repo.nouns, repo.pronouns]);
// }

// proper noun (eg. Juan)
function subjectFromProperNoun(repo: Repository): Subject {
  return randomFrom(repo.nouns.filter((v) => v.subType === "proper"));
}

function subjectFromNounWithPrefix(
  repo: Repository,
  prefixes: SubjectMatchable[]
): Subject {
  const noun = randomFrom(repo.nouns.filter((v) => v.subType !== "proper"));
  const prefix = prefixes.find((v) => v.matches(noun));
  const [key, value] = [prefix, noun]
    // skip empty
    .filter((v) => !!v)
    // extract key and value
    .map((v) => [v?.key ?? "", v?.value ?? ""])
    .reduce(
      // concat keys and values while skipping empty ones
      ([sumKey, sumValue], [currKey, currValue]) => [
        sumKey ? `${sumKey} ${currKey}` : currKey,
        sumValue ? `${sumValue} ${currValue}` : currValue,
      ],
      ["", ""]
    );
  return {
    key: key,
    value: value,
    gender: noun.gender,
    number: noun.number,
    person: noun.person,
  };
}

// article, non-proper noun (eg. el amigo)
function subjectFromNonProperNoun(repo: Repository): Subject {
  return subjectFromNounWithPrefix(repo, repo.articles);
}

// personal pronoun (eg. ella)
function subjectFromPersonalPronoun(repo: Repository): Subject {
  return randomFrom(repo.pronouns.filter((v) => v.subType === "personal"));
}

// possessive pronoun, non-proper noun (eg. mi amigo)
function subjectFromPossesiveNonProperNoun(repo: Repository): Subject {
  return subjectFromNounWithPrefix(
    repo,
    repo.pronouns.filter((v) => v.subType === "possessive")
  );
}

function randomSubject(repo: Repository): Subject {
  return randomFrom([
    subjectFromNonProperNoun,
    subjectFromPersonalPronoun,
    subjectFromPossesiveNonProperNoun,
  ])(repo);
}

export function generateRandomSentence(repo: Repository): string {
  const subject = randomSubject(repo);
  const predicate = randomFrom(repo.verbs.filter((v) => v.matches(subject)));
  const modifier = randomFrom(
    repo.adjectives.filter((a) => a.matches(subject))
  );
  const source = [subject, predicate, modifier]
    .map((v) => v?.key)
    .filter((v) => !!v)
    .join(" ");
  const target = [subject, predicate, modifier]
    .map((v) => v?.value)
    .filter((v) => !!v)
    .join(" ");
  return `${source} / ${target}`;
}
