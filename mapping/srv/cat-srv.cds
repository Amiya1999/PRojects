using Map from '../db/schema';

service coordinate {

    entity coordinates as projection on Map.Coordinates

}

service polyline{
    entity getinfo as projection on Map.PipeInfo
}