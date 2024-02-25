import { randomFrom } from "../random";
import {
  NumberAndGenderAndPerson,
  Subject,
  Repository,
  SubjectMatchable,
} from "./parser";

function subjecFrom<T extends NumberAndGenderAndPerson>(value: T): Subject {
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
  prefixes: SubjectMatchable[]
): Subject {
  const subject = subjecFrom(
    randomFrom(repo.nouns.filter((v) => v.subType !== "proper"))
  );
  const prefix = prefixes.find((v) => v.matches(subject));
  const [key, value] = [prefix, subject]
    // skip empty
    .filter((v) => !!v)
    // extract key and value
    .map((v) => [v?.key ?? "", v?.value ?? ""])
    // concat keys and values while skipping empty ones
    .reduce(
      ([sumKey, sumValue], [currKey, currValue]) => [
        sumKey ? `${sumKey} ${currKey}` : currKey,
        sumValue ? `${sumValue} ${currValue}` : currValue,
      ],
      ["", ""]
    );
  return {
    key: key,
    value: value,
    gender: subject.gender,
    number: subject.number,
    person: subject.person,
    type: "subject",
  };
}

// article, non-proper noun (eg. el amigo)
function subjectFromNonProperNoun(repo: Repository): Subject {
  return subjectFromNounWithPrefix(repo, repo.articles);
}

// personal pronoun (eg. ella)
function subjectFromPersonalPronoun(repo: Repository): Subject {
  return subjecFrom(
    randomFrom(repo.pronouns.filter((v) => v.subType === "personal"))
  );
}

// possessive pronoun, non-proper noun (eg. mi amigo)
function subjectFromPossesiveNonProperNoun(repo: Repository): Subject {
  return subjectFromNounWithPrefix(
    repo,
    repo.pronouns.filter((v) => v.subType === "possessive")
  );
}

// demonstrative pronoun, non-proper noun (eg. este chico)
function subjectFromDemonstrativeNonProperNoun(repo: Repository): Subject {
  return subjectFromNounWithPrefix(
    repo,
    repo.pronouns.filter((v) => v.subType === "demonstrative")
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
