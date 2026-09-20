// rb-offline/inert.js - offline stand-in installed by environment/adaptation.patch.
// Three documents in this tree used to load one remote DOM helper library from a content delivery network. The page
// asked that library for exactly one thing: to set one property on every element carrying one class. Those two call
// sites are rewritten in the same patch into the plain document calls that mean the same thing, so nothing is left
// that needs the library, and this file is therefore deliberately empty of behaviour.
// It is HARNESS, not application code: it defines no global, adds no property and changes nothing at runtime.
