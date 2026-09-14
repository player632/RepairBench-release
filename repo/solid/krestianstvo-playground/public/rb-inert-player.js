/*
 * repair-bench adaptation (environment/adaptation.patch): same-origin inert stand-in for the external embed
 * player script the documentation page used to load. Deliberately empty of behaviour - it defines nothing,
 * touches nothing and requests nothing - so the offline grading face has zero runtime network egress while
 * the document still carries the same script element in the same place.
 */
