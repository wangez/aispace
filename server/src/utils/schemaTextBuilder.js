function buildCollectionDocument(metadata) {
    let text = `集合名称: ${metadata.collectionName}\n`;
    text += `描述: ${metadata.description}\n`;
    text += `字段列表:\n`;
    metadata.fields.forEach((field) => {
        text += `- ${field.fieldName} (${field.type}): ${field.description}`;

        text += `\n`;
    });
    return text;
}

module.exports = { buildCollectionDocument };