import { randomFrom } from "../random";
import {
  NumberAndGenderAndPerson,
  Subject,
  Repository,
  SubjectMatchable,
} from "./parser";

export function subjecFrom<T extends NumberAndGenderAndPerson>(
  value: T
): Subject {
  return {
    ...value,
    type: "subject",
  };
}

// proper noun (eg. Juan)
function subjectFromProperNoun(repo: Repository): Subject {
  return subjecFrom(
    randomFrom(repo.nouns.filter((v) => v.subType === "proper"))
  );
}

function subjectFromNounWithPrefix(
  repo: Repository,
  prefixes: SubjectMatchable[],
  maybeSubject?: Subject
): Subject {
  const subject =
    maybeSubject ??
    subjecFrom(randomFrom(repo.nouns.filter((v) => v.subType !== "proper")));

  const prefix = prefixes.find((v) => v.matches(subject));
  const keyPrefix = prefixes.find((v) => v.keyMatches(subject));

  const key = [keyPrefix, subject]
    .map((v) => v?.key ?? "")
    .filter((v) => !!v)
    .join(" ");
  const value = [prefix, subject]
    .map((v) => v?.value ?? "")
    .filter((v) => !!v)
    .join(" ");

  return {
    key: key,
    value: value,
    gender: subject.gender,
    keyGender: subject.gender,
    number: subject.number,
    person: subject.person,
    type: "subject",
  };
}

// article, non-proper noun (eg. el amigo)
function subjectFromNonProperNoun(
  repo: Repository,
  maybeSubject?: Subject
): Subject {
  return subjectFromNounWithPrefix(repo, repo.articles, maybeSubject);
}

// personal pronoun (eg. ella)
function subjectFromPersonalPronoun(repo: Repository): Subject {
  return subjecFrom(
    randomFrom(repo.pronouns.filter((v) => v.subType === "personal"))
  );
}

// possessive pronoun, non-proper noun (eg. mi amigo)
function subjectFromPossesiveNonProperNoun(
  repo: Repository,
  maybeSubject?: Subject
): Subject {
  return subjectFromNounWithPrefix(
    repo,
    repo.pronouns.filter((v) => v.subType === "possessive"),
    maybeSubject
  );
}

// demonstrative pronoun, non-proper noun (eg. este chico)
export function subjectFromDemonstrativeNonProperNoun(
  repo: Repository,
  maybeSubject?: Subject
): Subject {
  return subjectFromNounWithPrefix(
    repo,
    repo.pronouns.filter((v) => v.subType === "demonstrative"),
    maybeSubject
  );
}

function randomSubject(repo: Repository): Subject {
  return randomFrom([
    subjectFromProperNoun,
    subjectFromNonProperNoun,
    subjectFromPersonalPronoun,
    subjectFromPossesiveNonProperNoun,
    subjectFromDemonstrativeNonProperNoun,
  ])(repo);
}

export function generateRandomSentenceForSubject(
  repo: Repository,
  subject: Subject
): string {
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

export function generateRandomSentence(repo: Repository): string {
  const subject = randomSubject(repo);
  return generateRandomSentenceForSubject(repo, subject);
}
