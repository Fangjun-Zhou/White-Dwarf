import { Entity } from "ecsy/Entity";
import { editorUIContext } from "./EditorContext";

export const updateEntityList = (entities: Array<Entity>) => {
  if (!editorUIContext.entityLists) {
    return;
  }

  // Traverse all entityLists.
  for (let i = 0; i < editorUIContext.entityLists.length; i++) {
    const entityList = editorUIContext.entityLists[i];
    // Remove all children.
    while (entityList.firstChild) {
      entityList.removeChild(entityList.firstChild);
    }
    // Add new children.
    for (let j = 0; j < entities.length; j++) {
      const entity = entities[j];
      const entityDiv = document.createElement("div");

      // Add entity name.
      const entityName = document.createElement("span");
      entityName.innerText = entity.name === "" ? "Entity" : entity.name;
      entityDiv.appendChild(entityName);

      // Add entity id.
      const entityId = document.createElement("span");
      entityId.innerText = entity.id.toString();
      entityDiv.appendChild(entityId);

      entityDiv.className = "entityListItem";
      entityList.appendChild(entityDiv);
      // TODO: Add select behavior.
    }
  }
};