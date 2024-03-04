namespace Map;


entity Coordinates{

key id :UUID;
startpoint:String;
endpoint:String;
}

entity PipeInfo {
    key id :UUID;
    name:String;
    length:Double;
    coordinate:Association to Coordinates;
}