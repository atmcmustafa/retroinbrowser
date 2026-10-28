import assert from "node:assert/strict";
import { test } from "node:test";
import { findCommentProblem } from "./moderation";

test("lets ordinary comments through, in English and Turkish", () => {
  for (const text of [
    "Works great on my phone, controller too.",
    "Runs at 60 fps in Chrome. The analog stick works fine.",
    "Classic! Played it as a kid. Assassin missions are still hard.",
    "Flight controls feel right and the cockpit view works.",
    "Mass Effect fans will like the co-op",
    "Bu cümle güzel, Cuma günü oynadım.",
    "Sık sık donuyor ama çok güzel.",
    "Biraz sıkıcı ama harika bir port, tavsiye ederim.",
    "Ses biraz kasıyor, analiz etmek lazım.",
    "Boks oyunu gibi değil, sorunsuz çalışıyor.",
    "Mortal Kombat MK menu works",
  ]) {
    assert.equal(findCommentProblem(text), null, text);
  }
});

test("rejects profanity and insults, including disguised forms", () => {
  for (const text of [
    "this port is shit",
    "what a load of fuck",
    "f*ck this",
    "SH1T port",
    "you are an idiot",
    "dev is a moron",
    "siktir git",
    "SİKTİR",
    "amk çalışmıyor",
    "orospu çocuğu",
    "yarrrrak gibi",
    "salaksın sen",
    "gerizekalı yapımcı",
    "aptallar",
    "bok gibi",
  ]) {
    assert.equal(findCommentProblem(text), "profanity", text);
  }
});

test("rejects links", () => {
  for (const text of [
    "play it at https://example.org",
    "go to www.something",
    "better port on example.com",
    "mail me at someone@gmail.com",
  ]) {
    assert.equal(findCommentProblem(text), "link", text);
  }
});
