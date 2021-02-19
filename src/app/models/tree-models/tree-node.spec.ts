/**
 * Copyright 2020  CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApiValueMetadata } from "../api-response-models/medco-node/api-value-metadata";
import { ValueType } from "../constraint-models/value-type";
import { DropMode } from "../drop-mode";
import { MedcoEncryptionDescriptor } from "./medco-encryption-descriptor";
import { TreeNode } from "./tree-node";
import { TreeNodeType } from "./tree-node-type";


function randomInt() {
  return Math.floor((Math.random() * 100))
}
function randString() {
  return (Math.random() + 1).toString(36).substring(7);
}
function randomBool() {
  return Math.random() > .5 ? true : false
}


function generateSimpleTreeNode(): TreeNode {
  const t = new TreeNode()
  t.path = randString()
  t.name = randString()
  t.displayName = randString();
  t.description = randString();

  t.appliedPath = randString();



  t.conceptCode = randString();
  t.dropMode = DropMode.TreeNode
  t.metadata = new ApiValueMetadata()
  t.depth = randomInt();
  t.subjectCount = randomInt();

  t.comment = randString();


  t.childrenAttached = randomBool();

  t.encryptionDescriptor = new MedcoEncryptionDescriptor();
  t.encryptionDescriptor.childrenIds = []
  t.encryptionDescriptor.encrypted = false
  t.encryptionDescriptor.id = randomInt()


  t.icon = randString();
  t.label = randString();
  t.expandedIcon = randString();
  t.collapsedIcon = randString();
  t.leaf = randomBool();
  t.expanded = randomBool();
  t.styleClass = randString();

  t.partialSelected = randomBool();


  return t
}

function advancedFieldsAreEqual(t1: TreeNode, t2: TreeNode): boolean {
  appliedConcept: TreeNode;
  const t = generateSimpleTreeNode()



  t.children = []
  t.parent = undefined

  return true //TODO
}

function simpleFieldAreEqual(t1: TreeNode, t2: TreeNode) {
  expect(t1.path).toEqual(t2.path)
  expect(t1.name).toEqual(t2.name)
  expect(t1.displayName).toEqual(t2.displayName)
  expect(t1.description).toEqual(t2.description)

  expect(t1.appliedPath).toEqual(t2.appliedPath)


  expect(t1.conceptCode).toEqual(t2.conceptCode)
  expect(t1.dropMode).toEqual(t2.dropMode)

  // expect(t1.metadata).toEqual(t2.metadata)
  expect(t1.depth).toEqual(t2.depth)
  expect(t1.subjectCount).toEqual(t2.subjectCount)

  expect(t1.comment).toEqual(t2.comment)


  expect(t1.childrenAttached).toEqual(t2.childrenAttached)


  expect(t1.icon).toEqual(t2.icon)
  expect(t1.label).toEqual(t2.label)
  expect(t1.expandedIcon).toEqual(t2.expandedIcon)
  expect(t1.collapsedIcon).toEqual(t2.collapsedIcon)
  expect(t1.leaf).toEqual(t2.leaf)
  expect(t1.expanded).toEqual(t2.expanded)
  expect(t1.styleClass).toEqual(t2.styleClass)

  expect(t1.partialSelected).toEqual(t2.partialSelected)

  expect(t1.valueType).toEqual(t2.valueType)
  expect(t1.nodeType).toEqual(t2.nodeType)

}

describe('Clone method of Tree Node class', () => {


  const valueTypes = [ValueType.CATEGORICAL,
  ValueType.NUMERICAL,
  ValueType.DATE,
  ValueType.TEXT,
  ValueType.SIMPLE,
  ]

  const nodeTypes = [TreeNodeType.CONCEPT_CONTAINER,
  TreeNodeType.CONCEPT_FOLDER,
  TreeNodeType.CONCEPT,
  TreeNodeType.MODIFIER,
  TreeNodeType.MODIFIER_FOLDER,
  TreeNodeType.MODIFIER_CONTAINER,
  TreeNodeType.GENOMIC_ANNOTATION,
  TreeNodeType.UNKNOWN]

  valueTypes.forEach(valueType => {
    nodeTypes.forEach(nodeType => {

      const t = generateSimpleTreeNode()

      t.valueType = valueType
      t.nodeType = nodeType
      t.children = []
      t.parent = undefined

      const tClone = t.clone()


      it('should work with the cloning of a simple tree node without parents or children', () => {
        simpleFieldAreEqual(t, tClone)
      })


      const t1 = generateSimpleTreeNode()
      const parent = generateSimpleTreeNode()
      t1.parent = parent

      const t1Clone = t1.clone()
      it('parents of treenode should be copied', () => {

        simpleFieldAreEqual(t1Clone, t1)
        simpleFieldAreEqual(t1Clone.parent, parent)
      })

      const t2 = generateSimpleTreeNode()
      const parent2 = generateSimpleTreeNode()
      const children = [1, 2, 3].map(_ => generateSimpleTreeNode())
      t2.parent = parent2
      t2.children = children
      const t2Clone = t2.clone(undefined, true)





      it('parents and children of treenode should be copied', () => {
        expect(t2Clone.children).toBeDefined()
        expect(t2Clone.children.length).toEqual(3)
        simpleFieldAreEqual(t2Clone, t2)
        simpleFieldAreEqual(t2Clone.parent, parent2)
        expect(t2.children.length).toEqual(t2Clone.children.length)
        t2Clone.children.forEach((clonedChild, index) => {
          simpleFieldAreEqual(clonedChild, t2.children[index])
        })

      })

    })
  })


})
