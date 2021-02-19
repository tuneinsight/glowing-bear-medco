import { TreeNode as PrimeNgTreeNode } from 'primeng';
import { ApiValueMetadata } from '../api-response-models/medco-node/api-value-metadata';
import { ValueType } from '../constraint-models/value-type';
import { DropMode } from '../drop-mode';
import { MedcoEncryptionDescriptor } from './medco-encryption-descriptor';
import { TreeNodeType } from './tree-node-type';

export class TreeNode implements PrimeNgTreeNode {

  // --- fields for GB logic
  path: string;
  name: string;
  displayName: string;
  description: string;

  // idiosyncratic to I2B2
  appliedPath: string;
  appliedConcept: TreeNode;

  // type of node (concept, study, ...)
  nodeType: TreeNodeType;
  // type of value if node is an ontology concept
  valueType: ValueType;
  conceptCode: string;
  dropMode: DropMode;
  metadata: ApiValueMetadata;
  // depth of the node in the tree
  depth: number;
  // number of subject (possibly undefined) associated with this node
  subjectCount: number;

  // A comment stored in the database precising some informations about this tree-node's content.
  comment: string;


  // flag to signal if the children were requested to the backend
  childrenAttached: boolean;

  encryptionDescriptor: MedcoEncryptionDescriptor;

  // --- fields for PrimeNg TreeNode logic
  children: TreeNode[];
  icon: string;
  label: string;
  expandedIcon: string;
  collapsedIcon: string;
  leaf: boolean;
  expanded: boolean;
  styleClass: string;
  parent: TreeNode;
  partialSelected: boolean;

  clone(clonedParent?: TreeNode, cloneChildren: boolean = true, cloneAppliedConcept: boolean = false): TreeNode {
    let copy: TreeNode = new TreeNode();

    copy.path = this.path;
    copy.name = this.name;
    copy.displayName = this.displayName;
    copy.description = this.description;

    copy.appliedPath = this.appliedPath;

    if (clonedParent !== undefined && clonedParent !== null) {
      copy.parent = clonedParent
    } else if (this.parent !== undefined && this.parent !== null) {
      copy.parent = this.parent.clone(undefined, false)
    }

    if (cloneAppliedConcept && this.appliedConcept) {
      copy.appliedConcept = this.appliedConcept.clone(undefined, false, false)
    }

    copy.nodeType = this.nodeType;
    copy.valueType = this.valueType;
    copy.conceptCode = this.conceptCode;
    copy.dropMode = this.dropMode;
    if (this.metadata) {
      copy.metadata = JSON.parse(JSON.stringify(this.metadata));
    }
    copy.depth = this.depth;
    copy.subjectCount = this.subjectCount;
    copy.childrenAttached = this.childrenAttached;
    if (this.encryptionDescriptor) {
      copy.encryptionDescriptor = new MedcoEncryptionDescriptor()
      copy.encryptionDescriptor.childrenIds = [...this.encryptionDescriptor.childrenIds]
      copy.encryptionDescriptor.encrypted = this.encryptionDescriptor.encrypted
      copy.encryptionDescriptor.id = this.encryptionDescriptor.id
    }


    copy.comment = this.comment
    copy.icon = this.icon;
    copy.label = this.label;
    copy.expandedIcon = this.expandedIcon;
    copy.collapsedIcon = this.collapsedIcon;
    copy.leaf = this.leaf;
    copy.expanded = this.expanded;
    copy.styleClass = this.styleClass;
    copy.partialSelected = this.partialSelected;

    if (cloneChildren && this.children) {
      const copiedChildren = this.children.map(child => {
        return child.clone(copy, true)
      })
      copy.children = copiedChildren
      console.log("Entering the copy children if statement", copy.children)
    }

    return copy
  }

  /**
   * Returns true if children were attached and at least 1 is present.
   * @returns {boolean}
   */
  hasChildren(): boolean {
    return this.childrenAttached && this.children.length > 0;
  }

  /**
   * Returns true if 'this' is a parent of 'node'.
   *
   * @param {TreeNode} node
   * @returns {boolean}
   */
  isParentOf(node: TreeNode): boolean {
    return node.path.startsWith(this.path) &&
      node.path.length > this.path.length;
  }


  /**
   * Returns true if 'this' is a parent if it is a modifier, modifier container or modifier folder.
   *
   * @returns {boolean}
   */
  isModifier() {
    return ((this.nodeType === TreeNodeType.MODIFIER)
      || (this.nodeType === TreeNodeType.MODIFIER_CONTAINER)
      || (this.nodeType === TreeNodeType.MODIFIER_FOLDER))
  }

  /**
   * Generate the tree structure based on the path of the children treeNodes and attach it to the current node.
   * Note: this will consume the treeNodes array.
   *
   * @param {TreeNode[]} treeNodes
   */
  attachChildTree(treeNodes: TreeNode[]) {

    for (let i = 0; i < treeNodes.length; i++) {
      if (treeNodes[i] === undefined) {
        continue;
      }
      this.children.push(treeNodes[i])
    }

    this.childrenAttached = true;
  }


  /**
   * Set the applied concept to modifiers in the children, if any.
   *
   * @param {TreeNode[]} treeNodes
   *
   */
  attachModifierData(treeNodes: TreeNode[]) {
    for (let i = 0; i < treeNodes.length; i++) {
      if (treeNodes[i] === undefined || !(treeNodes[i].isModifier())) {
        continue;
      }
      if (this.isModifier()) {
        treeNodes[i].appliedConcept = this.appliedConcept
      } else {
        treeNodes[i].appliedConcept = this
      }
    }
  }

  splitTreeNodePath(): TreeNodePaths {
    return TreeNode.splitTreeNodePath(this.path, this.appliedPath)
  }

  static splitTreeNodePath(path: string, appliedPath: string): TreeNodePaths {
    const splittedNodePath = path.split('/');
    const realAppliedPath = `${splittedNodePath.length > 1 ? `/${splittedNodePath[1]}` : ''}${appliedPath}${appliedPath[appliedPath.length - 1] !== '/' ? '/' : ''}`;
    const pathList = [
      ...(appliedPath !== '@' ? TreeNode.getPathList(realAppliedPath) : []),
      ...TreeNode.getPathList(path)
    ];
    return { pathElements: pathList, realAppliedPath };
  }

  private static getPathList(path: string) {
    const splittedPath = path.split('/').filter(value => value !== '');

    const pathList: string[] = [];

    splittedPath.forEach((_, index) => {
      pathList.push(splittedPath.slice(0, index + 1).reduce((result, value) => `${result}${value}/`, '/'));
    });

    return pathList;
  }
}

type TreeNodePaths = {
  pathElements: string[],
  realAppliedPath: string
}
